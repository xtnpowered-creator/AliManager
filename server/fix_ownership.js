
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alimanager',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
});

async function run() {
    try {
        const client = await pool.connect();
        try {
            const seedId = '00000000-0000-0000-0000-333333333333';
            const realId = '9f449545-700a-4ce5-8dd5-4d221041e15e';

            console.log(`Transferring tasks from Seed User (${seedId}) to Real User (${realId})...`);

            // 2. Transfer Tasks
            const updateRes = await client.query(
                `UPDATE tasks SET created_by = $1 WHERE created_by = $2`,
                [realId, seedId]
            );
            console.log(`Transferred ${updateRes.rowCount} tasks to Real User.`);

        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

run();
