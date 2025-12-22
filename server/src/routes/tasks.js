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

            console.log(`[GET /tasks] Fetching for ${role} (User: ${userId})`);

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
                        UNION
                        SELECT organization_id FROM users WHERE id = $1
                    )
                    SELECT t.*, 
                        CASE WHEN t.created_by = $1 THEN 'owner' ELSE 'member' END as access_source
                    FROM tasks t
                    LEFT JOIN users creator ON creator.id = t.created_by
                    WHERE t.organization_id IN (SELECT organization_id FROM user_orgs)
                    AND (creator.role != 'god' OR creator.role IS NULL) -- HIDE GOD TASKS
                    
                    UNION
                    
                    SELECT t.*, tc.access_level as access_source
                    FROM tasks t
                    JOIN task_collaborators tc ON tc.task_id = t.id
                    WHERE tc.user_id = $1

                    UNION

                    SELECT t.*, 'assignee' as access_source
                    FROM tasks t
                    JOIN task_collaborators ta ON ta.task_id = t.id
                    WHERE ta.user_id = $1

                    UNION

                    -- ALWAYS SEE MY OWN CREATIONS (Even if Admin hides God, user sees self)
                    SELECT t.*, 'owner' as access_source
                    FROM tasks t
                    WHERE t.created_by = $1
                `;
            }

            // Apply Filters (Post-Union Wrapper or Append)
            // Deduplication Strategy: A task can be returned multiple times with different 'access_source' values
            // (e.g. 'member' because you're in the org, and 'assignee' because you're assigned).
            // We use DISTINCT ON (id) to keep only one, prioritizing Owner > Assignee > Member.

            // 1. Define Priority for Access Source
            // owner = 1, assignee = 2, collaborator = 3, member = 4

            let finalQuery = `
                SELECT DISTINCT ON (id) * FROM (
                    ${queryText}
                ) AS united_tasks
                ORDER BY id, 
                CASE access_source 
                    WHEN 'owner' THEN 1 
                    WHEN 'god' THEN 1
                    WHEN 'assignee' THEN 2 
                    WHEN 'collaborator' THEN 3 
                    ELSE 4 
                END ASC
            `;

            // Note: The outer query needs to handle standard sorting later. 
            // Postgres requires ORDER BY to match DISTINCT ON first.
            // So we select from the DISTINCT result to apply final sort.

            finalQuery = `SELECT *, (created_by = $1) as is_owner FROM (${finalQuery}) AS deduped_tasks WHERE 1=1`;

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

            finalQuery += ` ORDER BY due_date ASC, 
                CASE priority 
                    WHEN 'asap' THEN 1 
                    WHEN 'high' THEN 1 -- legacy support
                    WHEN 'sooner' THEN 2 
                    WHEN 'medium' THEN 2 
                    WHEN 'whenever' THEN 3 
                    WHEN 'low' THEN 3 
                    ELSE 4 
                END ASC`;

            const result = await pool.query(finalQuery, params);
            console.log(`[GET /tasks] Query Result: ${result.rows.length} tasks found.`);

            // Enrich and Map to CamelCase
            const mappedTasks = result.rows.map(t => ({
                id: t.id,
                title: t.title,
                projectId: t.project_id,
                organizationId: t.organization_id,
                status: t.status,
                priority: t.priority,
                dueDate: t.due_date, // Map snake to camel
                dueDate: t.due_date, // Map snake to camel
                createdAt: t.created_at, // Mapping for P1 sorting
                completedAt: t.completed_at, // History logic
                description: t.description,
                accessSource: t.access_source,
                isOwner: t.is_owner, // Explicit ownership flag
                createdBy: t.created_by, // Expose creator ID for display
                assignedTo: [] // Will be populated below
            }));

            if (mappedTasks.length > 0) {
                const taskIds = mappedTasks.map(t => t.id);

                const assignmentsRes = await pool.query(
                    'SELECT task_id, user_id FROM task_collaborators WHERE task_id = ANY($1)',
                    [taskIds]
                );

                const assignmentsMap = {};
                assignmentsRes.rows.forEach(r => {
                    if (!assignmentsMap[r.task_id]) assignmentsMap[r.task_id] = [];
                    assignmentsMap[r.task_id].push(r.user_id);
                });

                mappedTasks.forEach(t => {
                    t.assignedTo = assignmentsMap[t.id] || [];
                });
            }

            res.json(mappedTasks);
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
                    [title, projectId || null, organization_id, status || 'todo', priority || 'whenever', dueDate, req.dbUser.id]
                );
                const newTask = insertRes.rows[0];

                if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
                    const values = assignedTo.map(uid => `('${newTask.id}', '${uid}', 'collaborator_free')`).join(',');
                    await client.query(
                        `INSERT INTO task_collaborators (task_id, user_id, access_level) VALUES ${values}`
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

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Update Tasks Table Fields
            const setClauses = [];
            const params = [];
            let idx = 1;

            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    const dbKey = key === 'dueDate' ? 'due_date' : key;
                    setClauses.push(`${dbKey} = $${idx}`);
                    params.push(updates[key]);
                    idx++;

                    // Special Handling for Status Change -> Completed At
                    if (key === 'status') {
                        if (updates.status === 'done') {
                            setClauses.push(`completed_at = NOW()`);
                        } else {
                            // If moving OUT of done, clear it
                            setClauses.push(`completed_at = NULL`);
                        }
                    }
                }
            });

            let updatedTask;
            if (setClauses.length > 0) {
                params.push(id);
                const queryText = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
                const result = await client.query(queryText, params);
                updatedTask = result.rows[0];
            } else {
                // If no task fields updated, fetch current state
                const res = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
                updatedTask = res.rows[0];
            }

            // 2. Update Assignments if provided
            if (updates.assignedTo !== undefined) {
                // Remove existing assignments
                await client.query('DELETE FROM task_collaborators WHERE task_id = $1', [id]);

                // Insert new assignments
                if (Array.isArray(updates.assignedTo) && updates.assignedTo.length > 0) {
                    const values = updates.assignedTo.map(uid => `('${id}', '${uid}', 'collaborator_free')`).join(',');
                    await client.query(`INSERT INTO task_collaborators (task_id, user_id, access_level) VALUES ${values}`);
                }
            }

            await client.query('COMMIT');

            // 3. Return enriched task
            // Fetch fresh assignments to be sure
            const assignRes = await client.query('SELECT user_id FROM task_collaborators WHERE task_id = $1', [id]);
            const finalAssignments = assignRes.rows.map(r => r.user_id);

            // Map DB snake_case to camelCase
            const finalTask = {
                id: updatedTask.id,
                title: updatedTask.title,
                projectId: updatedTask.project_id,
                organizationId: updatedTask.organization_id,
                status: updatedTask.status,
                priority: updatedTask.priority,
                priority: updatedTask.priority,
                dueDate: updatedTask.due_date,
                completedAt: updatedTask.completed_at,
                createdAt: updatedTask.created_at,
                description: updatedTask.description,
                accessSource: updatedTask.access_source, // Might be missing if not re-fetched with logic, but ok for now
                assignedTo: finalAssignments
            };

            res.json(finalTask);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('PATCH /tasks/:id Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release();
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

    // DELETE /api/tasks/:id
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        const { id: userId, role } = req.dbUser;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Fetch task to check ownership
            const taskRes = await client.query('SELECT created_by FROM tasks WHERE id = $1', [id]);
            if (taskRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Task not found' });
            }

            const task = taskRes.rows[0];

            // 2. Security Check: Only creator or god can delete
            if (role !== 'god' && task.created_by !== userId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'Only the task creator can delete this task.' });
            }

            // 3. Delete (Cascading will handle assignments, collaborators, and steps)
            await client.query('DELETE FROM tasks WHERE id = $1', [id]);

            await client.query('COMMIT');
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('DELETE /tasks/:id Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release();
        }
    });

    return router;
};
