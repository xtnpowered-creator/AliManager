
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alimanager',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
});

const run = async () => {
    try {
        console.log('Checking for GOD user...');
        const res = await pool.query("SELECT id, email, role, display_name FROM users WHERE role = 'god'");
        console.log(`Found ${res.rows.length} GOD users.`);
        res.rows.forEach(r => console.log(JSON.stringify(r)));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
};

run();
