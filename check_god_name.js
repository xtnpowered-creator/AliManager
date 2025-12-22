
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkGod() {
    try {
        const res = await pool.query("SELECT * FROM users WHERE role = 'god'");
        console.log("God Users:");
        res.rows.forEach(u => {
            console.log(JSON.stringify(u, null, 2));
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkGod();
