
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

async function run() {
    try {
        console.log('Fixing Alisara...');
        const res = await pool.query(`
            UPDATE users 
            SET 
                display_name = 'Alisara Plyler',
                company_label = 'Mattamay Homes',
                position = 'Purchasing Director',
                department = 'Purchasing Dept.'
            WHERE id = '00000000-0000-0000-0000-222222222222'
            RETURNING *;
        `);
        console.log('Fixed:', JSON.stringify(res.rows[0], null, 2));
    } catch (e) { console.error(e); }
    finally { pool.end(); }
}
run();
