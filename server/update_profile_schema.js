
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
            console.log("Adding 'position' column...");
            await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100)");

            console.log("Updating God User Profile...");
            const realId = '9f449545-700a-4ce5-8dd5-4d221041e15e'; // From Diagnostics

            const updateRes = await client.query(
                `UPDATE users 
                 SET company_label = 'AliManager Inc.', 
                     position = 'System Architect'
                 WHERE id = $1`,
                [realId]
            );
            console.log(`Updated User Profile: ${updateRes.rowCount}`);

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
