
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
            console.log("--- USERS IN DATABASE ---");
            const res = await client.query(`SELECT id, email, display_name, firebase_uid, created_at FROM users`);
            res.rows.forEach(u => {
                console.log(`[${u.id}] ${u.email} | Name: "${u.display_name}" | Firebase: ${u.firebase_uid}`);
            });
            console.log("-------------------------");
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
