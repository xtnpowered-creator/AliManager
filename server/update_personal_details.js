
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
            console.log("Updating Christian Plyler's Profile...");
            const realId = '9f449545-700a-4ce5-8dd5-4d221041e15e'; // From Diagnostics

            const updateRes = await client.query(
                `UPDATE users 
                 SET display_name = 'Christian Plyler',
                     company_label = 'xtn_Powered', 
                     position = 'Owner',
                     role = 'god'
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
