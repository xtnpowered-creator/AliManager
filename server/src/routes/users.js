import express from 'express';

export const createUsersRouter = (pool) => {
    const router = express.Router();

    // GET /api/users (The Directory)
    router.get('/', async (req, res) => {
        try {
            const { role, organization_id } = req.dbUser;

            let queryText = 'SELECT id, display_name as name, role, email, avatar_url as avatar, company_label as company FROM users';
            let params = [];

            // RBAC: Tenant Isolation
            if (role !== 'god') {
                queryText += ' WHERE organization_id = $1';
                params.push(organization_id);
            }

            queryText += ' ORDER BY display_name ASC';

            const result = await pool.query(queryText, params);
            res.json(result.rows);
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

    return router;
};
