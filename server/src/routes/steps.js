import express from 'express';

export const createStepsRouter = (pool) => {
    const router = express.Router();

    // GET /api/steps
    // Query: ?taskId=UUID
    router.get('/', async (req, res) => {
        try {
            const { taskId } = req.query;
            const params = [];
            let queryText = 'SELECT * FROM task_steps WHERE 1=1';

            if (taskId) {
                queryText += ' AND task_id = $1';
                params.push(taskId);
            }

            queryText += ' ORDER BY position ASC, created_at ASC';

            const result = await pool.query(queryText, params);

            // Map to camelCase
            const steps = result.rows.map(s => ({
                id: s.id,
                taskId: s.task_id,
                title: s.title,
                isCompleted: s.is_completed,
                position: s.position,
                assignedTo: s.assigned_to,
                dueDate: s.due_date,
                duration: s.duration
            }));

            res.json(steps);
        } catch (error) {
            console.error('GET /steps Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /api/steps
    router.post('/', async (req, res) => {
        const { taskId, title, assignedTo, dueDate, duration } = req.body;

        if (!taskId || !title) {
            return res.status(400).json({ error: 'taskId and title are required' });
        }

        try {
            // Get max position for simple append
            const posRes = await pool.query('SELECT MAX(position) as max_pos FROM task_steps WHERE task_id = $1', [taskId]);
            const newPos = (posRes.rows[0].max_pos || 0) + 1;

            const result = await pool.query(
                `INSERT INTO task_steps (task_id, title, position, assigned_to, due_date, duration)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [taskId, title, newPos, assignedTo || null, dueDate || null, duration || 1]
            );

            const s = result.rows[0];
            res.status(201).json({
                id: s.id,
                taskId: s.task_id,
                title: s.title,
                isCompleted: s.is_completed,
                position: s.position,
                assignedTo: s.assigned_to,
                dueDate: s.due_date,
                duration: s.duration
            });
        } catch (error) {
            console.error('POST /steps Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /api/steps/:id
    router.patch('/:id', async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        const allowedUpdates = ['title', 'isCompleted', 'position', 'assignedTo', 'dueDate', 'duration'];

        try {
            const setClauses = [];
            const params = [];
            let idx = 1;

            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    const dbKey = key === 'isCompleted' ? 'is_completed' :
                        key === 'assignedTo' ? 'assigned_to' :
                            key === 'dueDate' ? 'due_date' : key;

                    setClauses.push(`${dbKey} = $${idx}`);
                    params.push(updates[key]);
                    idx++;
                }
            });

            if (setClauses.length === 0) return res.json({ message: 'No updates provided' });

            params.push(id);
            const queryText = `UPDATE task_steps SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;

            const result = await pool.query(queryText, params);

            if (result.rows.length === 0) return res.status(404).json({ error: 'Step not found' });

            const s = result.rows[0];
            res.json({
                id: s.id,
                taskId: s.task_id,
                title: s.title,
                isCompleted: s.is_completed,
                position: s.position,
                assignedTo: s.assigned_to,
                dueDate: s.due_date,
                duration: s.duration
            });
        } catch (error) {
            console.error('PATCH /steps/:id Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /api/steps/:id
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM task_steps WHERE id = $1', [id]);
            res.json({ message: 'Step deleted' });
        } catch (error) {
            console.error('DELETE /steps/:id Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
};
