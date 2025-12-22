
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const pool = new pg.Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alimanager',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
});

async function check() {
    try {
        const pRes = await pool.query('SELECT COUNT(*) FROM projects');
        const tRes = await pool.query('SELECT COUNT(*) FROM tasks');
        const uRes = await pool.query('SELECT COUNT(*) FROM users');
        // task_collaborators NOT task_assignees
        const taRes = await pool.query('SELECT COUNT(*) FROM task_collaborators');

        console.log('--- DB COUNTS ---');
        console.log(`Users: ${uRes.rows[0].count}`);
        console.log(`Projects: ${pRes.rows[0].count}`);
        console.log(`Tasks: ${tRes.rows[0].count}`);
        console.log(`Collaborators: ${taRes.rows[0].count}`);

        // Check Org ID of a task
        if (parseInt(tRes.rows[0].count) > 0) {
            const sample = await pool.query('SELECT organization_id, title FROM tasks LIMIT 1');
            console.log(`Sample Task Org: ${sample.rows[0].organization_id} (${sample.rows[0].title})`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
