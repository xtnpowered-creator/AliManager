import express from 'express';

export const createProjectsRouter = (pool) => {
    const router = express.Router();

    // GET /api/projects
    router.get('/', async (req, res) => {
        try {
            const { role, organization_id } = req.dbUser;

            let queryText = 'SELECT * FROM projects';
            let params = [];

            // RBAC:
            // God -> Sees everything
            // Admin/User -> Sees only their organization's projects
            if (role !== 'god') {
                queryText += ' WHERE organization_id = $1';
                params.push(organization_id);
            }

            queryText += ' ORDER BY created_at DESC';

            const result = await pool.query(queryText, params);
            res.json(result.rows);
        } catch (error) {
            console.error('GET /projects Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /api/projects
    router.post('/', async (req, res) => {
        const { role, organization_id } = req.dbUser;
        const { title, description, status } = req.body;

        // Only Admin or God can create projects
        if (role === 'user') {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        try {
            const result = await pool.query(
                `INSERT INTO projects (organization_id, title, description, status) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [organization_id, title, description, status || 'planning']
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('POST /projects Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
};
