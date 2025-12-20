import express from 'express';

export const createDelegationsRouter = (pool) => {
    const router = express.Router();

    // Middleware: Ensure Admin/God
    const requireAdmin = (req, res, next) => {
        if (req.dbUser.role !== 'admin' && req.dbUser.role !== 'god') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        next();
    };

    router.use(requireAdmin);

    // GET / - List Active Delegations
    router.get('/', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT d.*, u.display_name as delegate_name, u.email as delegate_email, u.avatar_url as delegate_avatar
                FROM role_delegations d
                JOIN users u ON d.delegate_id = u.id
                WHERE d.organization_id = $1 
                AND d.status = 'active'
                AND d.expires_at > NOW()
                ORDER BY d.created_at DESC
            `, [req.dbUser.organization_id]);
            res.json(result.rows);
        } catch (err) {
            console.error('List Delegations Error:', err);
            res.status(500).json({ error: 'Failed to list delegations' });
        }
    });

    // POST / - Create Delegation
    router.post('/', async (req, res) => {
        const { delegateId, days } = req.body;

        if (!delegateId || !days) {
            return res.status(400).json({ error: 'Missing delegateId or days' });
        }

        try {
            const result = await pool.query(`
                INSERT INTO role_delegations 
                (delegator_id, delegate_id, organization_id, role, starts_at, expires_at, status)
                VALUES ($1, $2, $3, 'admin', NOW(), NOW() + make_interval(days => $4), 'active')
                RETURNING *
            `, [req.dbUser.id, delegateId, req.dbUser.organization_id, days]);

            const newDelegation = result.rows[0];
            res.status(201).json(newDelegation);
        } catch (err) {
            console.error('Create Delegation Error:', err);
            res.status(500).json({ error: 'Failed to create delegation' });
        }
    });

    // DELETE /:id - Cancel/Revoke Delegation
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query(`
                UPDATE role_delegations 
                SET status = 'cancelled' 
                WHERE id = $1 AND organization_id = $2
            `, [id, req.dbUser.organization_id]);
            res.json({ success: true });
        } catch (err) {
            console.error('Revoke Delegation Error:', err);
            res.status(500).json({ error: 'Failed to revoke delegation' });
        }
    });

    return router;
};
