import express from 'express';

export const createTasksRouter = (pool) => {
    const router = express.Router();

    // GET /api/tasks
    // Supports query params: ?projectId=... | ?status=...
    router.get('/', async (req, res) => {
        try {
            const { role, organization_id, id: userId } = req.dbUser;
            const { projectId, status } = req.query;

            let queryText = 'SELECT * FROM tasks';
            let params = [];
            let whereClauses = [];

            // 1. Tenant Isolation
            if (role !== 'god') {
                params.push(organization_id);
                whereClauses.push(`organization_id = $${params.length}`);
            }

            // 2. Filters
            if (projectId) {
                params.push(projectId);
                whereClauses.push(`project_id = $${params.length}`);
            }
            if (status) {
                params.push(status);
                whereClauses.push(`status = $${params.length}`);
            }

            if (whereClauses.length > 0) {
                queryText += ' WHERE ' + whereClauses.join(' AND ');
            }

            queryText += ' ORDER BY due_date ASC';

            const result = await pool.query(queryText, params);

            // TODO: We might need to fetch assignments too (JOIN or separate query)
            // For now, let's keep it simple. The frontend expects 'assignedTo' array of IDs.
            // We need to hydrated that. 
            // Let's do a quick enrichment.

            const tasks = result.rows;
            // Fetch assignments for these tasks
            if (tasks.length > 0) {
                const taskIds = tasks.map(t => t.id);
                const assignmentsRes = await pool.query(
                    'SELECT task_id, user_id FROM task_assignments WHERE task_id = ANY($1)',
                    [taskIds]
                );

                const assignmentsMap = {};
                assignmentsRes.rows.forEach(r => {
                    if (!assignmentsMap[r.task_id]) assignmentsMap[r.task_id] = [];
                    assignmentsMap[r.task_id].push(r.user_id);
                });

                tasks.forEach(t => {
                    t.assignedTo = assignmentsMap[t.id] || [];
                });
            }

            res.json(tasks);
        } catch (error) {
            console.error('GET /tasks Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /api/tasks
    router.post('/', async (req, res) => {
        const { role, organization_id } = req.dbUser;
        const { title, projectId, assignedTo, dueDate, priority, status } = req.body;

        try {
            // Transaction for Task + Assignments
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const insertRes = await client.query(
                    `INSERT INTO tasks (title, project_id, organization_id, status, priority, due_date)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [title, projectId || null, organization_id, status || 'todo', priority || 'medium', dueDate]
                );
                const newTask = insertRes.rows[0];

                if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
                    const values = assignedTo.map(uid => `('${newTask.id}', '${uid}')`).join(',');
                    await client.query(
                        `INSERT INTO task_assignments (task_id, user_id) VALUES ${values}`
                    );
                }

                await client.query('COMMIT');

                // Return enriched task
                newTask.assignedTo = assignedTo || [];
                res.status(201).json(newTask);
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('POST /tasks Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /api/tasks/:id
    router.patch('/:id', async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        const allowedUpdates = ['title', 'status', 'priority', 'dueDate', 'description'];

        try {
            // Construct dynamic update query
            const setClauses = [];
            const params = [];
            let idx = 1;

            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    // Convert camelCase to snake_case for DB
                    const dbKey = key === 'dueDate' ? 'due_date' : key;
                    setClauses.push(`${dbKey} = $${idx}`);
                    params.push(updates[key]);
                    idx++;
                }
            });

            if (setClauses.length === 0) return res.json({ message: 'No updates provided' });

            params.push(id);
            const queryText = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;

            const result = await pool.query(queryText, params);
            res.json(result.rows[0]);
        } catch (error) {
            console.error('PATCH /tasks/:id Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
};
