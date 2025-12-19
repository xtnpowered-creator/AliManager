import express from 'express';

export const createRequestsRouter = (pool) => {
    const router = express.Router();

    // POST /api/requests - Submit a new request
    router.post('/', async (req, res) => {
        try {
            const { organization_id, id: requester_id } = req.dbUser;
            const { type, payload } = req.body;

            if (!type || !payload) {
                return res.status(400).json({ error: 'Type and payload are required' });
            }

            // Insert request
            const result = await pool.query(
                `INSERT INTO requests (organization_id, requester_id, type, payload)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [organization_id, requester_id, type, payload]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('POST /requests Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /api/requests - List requests (Admin/God only)
    router.get('/', async (req, res) => {
        try {
            const { role, organization_id } = req.dbUser;

            if (role === 'user') {
                return res.status(403).json({ error: 'Forbidden: Admins only' });
            }

            let queryText = `
                SELECT r.*, u.display_name as requester_name, u.avatar_url as requester_avatar
                FROM requests r
                LEFT JOIN users u ON r.requester_id = u.id
            `;
            let params = [];
            let whereClauses = [];

            // Filter by organization for non-gods
            if (role !== 'god') {
                whereClauses.push(`r.organization_id = $${params.length + 1}`);
                params.push(organization_id);
            }

            // Optional status filter
            const { status } = req.query;
            if (status) {
                whereClauses.push(`r.status = $${params.length + 1}`);
                params.push(status);
            }

            if (whereClauses.length > 0) {
                queryText += ' WHERE ' + whereClauses.join(' AND ');
            }

            queryText += ' ORDER BY r.created_at DESC';

            const result = await pool.query(queryText, params);
            res.json(result.rows);
        } catch (error) {
            console.error('GET /requests Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /api/requests/:id/resolve - Approve or Reject
    router.patch('/:id/resolve', async (req, res) => {
        const client = await pool.connect(); // Use a client for transaction
        try {
            const { role, organization_id } = req.dbUser;
            const { id } = req.params;
            const { status, admin_notes } = req.body; // status must be 'APPROVED' or 'REJECTED'

            if (!['APPROVED', 'REJECTED'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
            }

            if (role === 'user') {
                return res.status(403).json({ error: 'Forbidden' });
            }

            await client.query('BEGIN');

            // 1. Fetch the request to verify existence and permissions
            let requestQuery = 'SELECT * FROM requests WHERE id = $1';
            const requestParams = [id];

            // RBAC Isolation
            if (role !== 'god') {
                requestQuery += ' AND organization_id = $2';
                requestParams.push(organization_id);
            }

            const requestResult = await client.query(requestQuery, requestParams);
            if (requestResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Request not found' });
            }

            const request = requestResult.rows[0];

            if (request.status !== 'PENDING') {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Request is already resolved' });
            }

            // 2. Execute Command if APPROVED
            if (status === 'APPROVED') {
                switch (request.type) {
                    case 'DELETE_USER':
                        const targetUserId = request.payload.targetUserId;
                        if (!targetUserId) throw new Error('Invalid payload for DELETE_USER');

                        // Execute delete
                        // We use the same isolation rules: Admin can only delete from their org
                        // But since the Request belongs to the org, the user *must* be in that org (assuming normal creation)
                        // However, strictly speaking, we should verify the target user is in the org.
                        // Assuming DELETE FROM users WHERE id AND org_id verifies this for us.

                        let deleteQuery = 'DELETE FROM users WHERE id = $1';
                        let deleteParams = [targetUserId];
                        if (role !== 'god') {
                            deleteQuery += ' AND organization_id = $2';
                            deleteParams.push(organization_id);
                        }
                        await client.query(deleteQuery, deleteParams);
                        break;

                    case 'REASSIGN_TASK':
                        // Placeholder for future logic
                        // const { taskId, toUserId } = request.payload;
                        // await client.query('UPDATE tasks ...');
                        break;

                    default:
                        // Unknown command type - Fail safe?
                        // For now we allow approving unknown types as "Acknowledged" or throw error.
                        // Let's throw to prevent data rot.
                        throw new Error(`Unknown request type: ${request.type}`);
                }
            }

            // 3. Update Request Status
            const updateResult = await client.query(
                `UPDATE requests 
                 SET status = $1, admin_notes = $2, updated_at = NOW() 
                 WHERE id = $3 
                 RETURNING *`,
                [status, admin_notes, id]
            );

            await client.query('COMMIT');

            res.json(updateResult.rows[0]);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('PATCH /requests/:id/resolve Error:', error);
            res.status(500).json({ error: error.message || 'Internal Server Error' });
        } finally {
            client.release();
        }
    });

    return router;
};
