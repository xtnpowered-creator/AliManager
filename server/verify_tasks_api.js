import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alimanager',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
});

async function run() {
    try {
        console.log('Connecting...');
        // Mock finding a user (Alisara)
        const userRes = await pool.query("SELECT id FROM users WHERE email ILIKE '%alisara%' OR display_name ILIKE '%alisara%' LIMIT 1");
        const userId = userRes.rows[0].id;
        console.log('User ID:', userId);

        // Raw SQL from routs/tasks.js (simplified logic for verified user)
        const queryText = `
             WITH user_orgs AS (
                SELECT organization_id FROM memberships WHERE user_id = $1
                UNION
                SELECT organization_id FROM users WHERE id = $1
            )
            SELECT t.*, 
                CASE WHEN t.created_by = $1 THEN 'owner' ELSE 'member' END as access_source
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

        const finalQuery = `SELECT *, (created_by = $1) as is_owner FROM (${queryText}) AS united_tasks WHERE 1=1 ORDER BY created_at DESC LIMIT 10`;

        const res = await pool.query(finalQuery, [userId]);
        console.log(`Query success. Rows: ${res.rowCount}`);

        // Mock Assignment Population Logic
        const mappedTasks = res.rows.map(t => ({ ...t, assignedTo: [] }));
        const taskIds = mappedTasks.map(t => t.id);
        const assignRes = await pool.query('SELECT task_id, user_id FROM task_assignments WHERE task_id = ANY($1::uuid[])', [taskIds]);

        assignRes.rows.forEach(r => {
            const task = mappedTasks.find(t => t.id === r.task_id);
            if (task) task.assignedTo.push(r.user_id);
        });

        if (mappedTasks.length > 0) {
            console.log('Sample Task:', {
                id: mappedTasks[0].id,
                title: mappedTasks[0].title,
                status: mappedTasks[0].status,
                completed_at: mappedTasks[0].completed_at,
                assignedTo: mappedTasks[0].assignedTo
            });
        }

    } catch (err) {
        console.error('Query Failed:', err);
    } finally {
        await pool.end();
    }
}

run();
