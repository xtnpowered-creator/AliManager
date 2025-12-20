import express from 'express';

export const createUsersRouter = (pool) => {
    const router = express.Router();

    // GET /api/users/me (Current User Profile)
    router.get('/me', async (req, res) => {
        try {
            const { id } = req.dbUser;
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const u = result.rows[0];
            const profile = {
                id: u.id,
                name: u.display_name,
                email: u.email,
                role: req.dbUser.role || u.role, // Use Middleware role (handles delegation)
                isDelegated: req.dbUser.is_delegated || false,
                delegationExpiresAt: req.dbUser.delegation_expires_at || null,
                avatar: u.avatar_url || (u.display_name || u.email).charAt(0).toUpperCase(),
                company: u.company_label || '',
                department: u.department || '',
                position: u.position || '',
                status: u.status,
                organizationId: u.organization_id
            };

            res.json(profile);
        } catch (error) {
            console.error('GET /users/me Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /api/users (The Directory)
    router.get('/', async (req, res) => {
        try {
            const { role, organization_id } = req.dbUser;

            let queryText;
            let params = [];

            if (role === 'god') {
                queryText = `
                    SELECT id, display_name, role, email, avatar_url, company_label, department, position 
                    FROM users 
                    ORDER BY display_name ASC
                `;
            } else {
                // Fetch Members AND Guests (Collaborators on Org Projects)
                // We use distinct on ID to avoid duplicates if someone is both (shouldn't happen but safe)
                queryText = `
                    WITH org_members AS (
                        -- Use Memberships OR Legacy Org ID
                        SELECT u.id, u.display_name, u.role::text, u.email, u.avatar_url, u.company_label, u.department, u.position, 'member' as source
                        FROM users u
                        LEFT JOIN memberships m ON m.user_id = u.id
                        WHERE m.organization_id = $1 OR u.organization_id = $1
                    ),
                    org_guests AS (
                        -- External users collaborating on this Org's tasks
                        SELECT u.id, u.display_name, 'guest' as role, u.email, u.avatar_url, u.company_label, u.department, u.position, 'guest' as source
                        FROM users u
                        JOIN task_collaborators tc ON tc.user_id = u.id
                        JOIN tasks t ON t.id = tc.task_id
                        WHERE t.organization_id = $1
                        AND u.id NOT IN (SELECT id FROM org_members) -- Exclude existing members
                    )
                    SELECT * FROM org_members
                    UNION ALL
                    SELECT * FROM org_guests
                    ORDER BY display_name ASC
                `;
                params.push(organization_id);
            }

            const result = await pool.query(queryText, params);

            // Map result to frontend expected format if needed (it matches already)
            // Map result to frontend expected format if needed (it matches already)
            if (result.rows.length > 0) {
                console.log('[API DEBUG] Row 0:', JSON.stringify(result.rows[0]));
            }
            const colleagues = result.rows.map(row => ({
                id: row.id,
                name: row.display_name || row.email.split('@')[0],
                role: row.role, // 'admin', 'user', 'guest', 'god'
                email: row.email,
                avatar: row.avatar_url || '👤',
                company: row.company_label,
                department: row.department,
                position: row.position
            }));

            res.json(colleagues);
        } catch (error) {
            console.error('GET /users Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /api/users/:id
    router.delete('/:id', async (req, res) => {
        try {
            const { role, organization_id } = req.dbUser;
            const { id } = req.params;

            // RBAC: Only Admin or God can delete users
            if (role === 'user') {
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            }

            // Ensure tenant isolation (unless God)
            let queryText = 'DELETE FROM users WHERE id = $1';
            let params = [id];

            if (role !== 'god') {
                queryText += ' AND organization_id = $2';
                params.push(organization_id);
            }

            const result = await pool.query(queryText, params);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'User not found or access denied' });
            }

            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('DELETE /users/:id Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /api/users (Add New Directory Entry)
    router.post('/', async (req, res) => {
        try {
            const { role: requesterRole, organization_id } = req.dbUser;
            const { email, name } = req.body;

            // RBAC: Only Admin or God can add users
            if (requesterRole !== 'admin' && requesterRole !== 'god') {
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            }

            if (!email || !name) {
                return res.status(400).json({ error: 'Email and Name are required' });
            }

            // Check if user exists
            const existingRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (existingRes.rows.length > 0) {
                const existingUser = existingRes.rows[0];

                // If they exist but rely on Memberships (Viral Loop), ensuring they are linked
                await pool.query(
                    `INSERT INTO memberships (user_id, organization_id, role)
                     VALUES ($1, $2, 'user')
                     ON CONFLICT DO NOTHING`,
                    [existingUser.id, organization_id]
                );

                // Also update legacy organization_id if null (adoption)
                if (!existingUser.organization_id) {
                    await pool.query('UPDATE users SET organization_id = $1 WHERE id = $2', [organization_id, existingUser.id]);
                }

                return res.status(200).json({ message: 'User already exists, added to directory.', user: existingUser });
            }

            // Create New "Ghost" User
            // We set them as a member of this Org immediately.
            const newUserRes = await pool.query(
                `INSERT INTO users (firebase_uid, email, display_name, role, organization_id, status, avatar_url)
                 VALUES ($1, $2, $3, 'user', $4, 'pending', '')
                 RETURNING *`,
                [`ghost_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, email, name, organization_id]
            );

            const newUser = newUserRes.rows[0];

            // Ensure Membership Record
            await pool.query(
                `INSERT INTO memberships (user_id, organization_id, role)
                 VALUES ($1, $2, 'user')`,
                [newUser.id, organization_id]
            );

            res.status(201).json(newUser);

        } catch (error) {
            console.error('POST /users Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
};
