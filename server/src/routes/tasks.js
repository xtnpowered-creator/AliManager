import express from 'express';

export const createTasksRouter = (pool) => {
    const router = express.Router();

    // GET /api/tasks
    // Supports query params: ?projectId=... | ?status=...
    router.get('/', async (req, res) => {
        try {
            const { role, id: userId } = req.dbUser;
            const { projectId, status } = req.query;

            let queryText;
            let params = [userId]; // $1 is userId

            if (role === 'god') {
                // GOD MODE: See all tasks
                queryText = `
                    SELECT t.*, 'god' as access_source 
                    FROM tasks t
                    WHERE 1=1
                `;
            } else {
                // SCOPED MODE: Memberships + Collaborations
                queryText = `
                    WITH user_orgs AS (
                        SELECT organization_id FROM memberships WHERE user_id = $1
                    )
                    SELECT t.*, 'member' as access_source 
                    FROM tasks t
                    WHERE t.organization_id IN (SELECT organization_id FROM user_orgs)
                    
                    UNION
                    
                    SELECT t.*, tc.access_level as access_source
                    FROM tasks t
                    JOIN task_collaborators tc ON tc.task_id = t.id
                    WHERE tc.user_id = $1

                    UNION

                    SELECT t.*, 'assignee' as access_source
                    FROM tasks t
                    JOIN task_assignments ta ON ta.task_id = t.id
                    WHERE ta.user_id = $1
                `;
            }

            // Apply Filters (Post-Union Wrapper or Append)
            // Since UNION makes WHERE clauses tricky, we wrap it.
            // But for simplicity/perf, let's wrap the whole thing if filters exist.

            let finalQuery = `SELECT * FROM (${queryText}) AS united_tasks WHERE 1=1`;
            let paramIdx = params.length + 1;

            if (projectId) {
                finalQuery += ` AND project_id = $${paramIdx}`;
                params.push(projectId);
                paramIdx++;
            }
            if (status) {
                finalQuery += ` AND status = $${paramIdx}`;
                params.push(status);
                paramIdx++;
            }

            finalQuery += ' ORDER BY due_date ASC';

            const result = await pool.query(finalQuery, params);

            // Enrichment: Fetch Assignments
            const tasks = result.rows;
            if (tasks.length > 0) {
                const taskIds = tasks.map(t => t.id);
                // Safe way to pass array for ANY($N)
                // Note: node-postgres handles arrays automatically if passed correctly.

                // Fetch assignments
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
                    `INSERT INTO tasks (title, project_id, organization_id, status, priority, due_date, created_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                    [title, projectId || null, organization_id, status || 'todo', priority || 'medium', dueDate, req.dbUser.id]
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

    // POST /api/tasks/:id/invite
    router.post('/:id/invite', async (req, res) => {
        const { id: taskId } = req.params;
        const { email } = req.body;
        const { id: requesterId, organization_id } = req.dbUser; // Currently we assume requester is in context org

        if (!email) return res.status(400).json({ error: 'Email is required' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Verify Requester Access (Must be a Member of the Task's Org)
            // We fetch the task to get its org_id.
            const taskRes = await client.query('SELECT organization_id FROM tasks WHERE id = $1', [taskId]);
            if (taskRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Task not found' });
            }
            const taskOrgId = taskRes.rows[0].organization_id;

            // Strict check: Requester must match the task's organization
            // In future with multi-org memberships, we'd check if `taskOrgId` is in `req.user.memberships`
            // For now, `organization_id` on user is the primary one.
            if (organization_id !== taskOrgId && req.dbUser.role !== 'god') {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'Only organization members can invite collaborators.' });
            }

            // 2. Resolve Target User (Ghost or Existing)
            let targetUserId;
            const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);

            if (userRes.rows.length > 0) {
                targetUserId = userRes.rows[0].id;
            } else {
                // Create Ghost User
                console.log(`[Invite] Creating Ghost User for ${email}`);
                const ghostRes = await client.query(
                    `INSERT INTO users (firebase_uid, email, role, status, display_name)
                     VALUES ($1, $2, 'user', 'pending', $3)
                     RETURNING id`,
                    [`ghost_${Date.now()}`, email, email.split('@')[0]]
                );
                targetUserId = ghostRes.rows[0].id;
            }

            // 3. Add to Task Collaborators
            await client.query(
                `INSERT INTO task_collaborators (task_id, user_id, access_level)
                 VALUES ($1, $2, 'collaborator_free')
                 ON CONFLICT (task_id, user_id) DO NOTHING`,
                [taskId, targetUserId]
            );

            await client.query('COMMIT');

            res.json({ message: `Invited ${email}`, userId: targetUserId });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('POST /tasks/:id/invite Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release();
        }
    });

    return router;
};
