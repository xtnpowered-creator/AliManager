
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
            const realId = '9f449545-700a-4ce5-8dd5-4d221041e15e'; // From Diagnostics

            console.log(`Updating Persona for User (${realId})...`);

            // 1. Delete the "Old" Christian (God) seed user to free up email/name if unique
            // But first check if they collide.
            // If I tried to set email to 'christianplyler@gmail.com' on realId, it might fail if seedId has it.

            // Delete seed user explicitly
            await client.query('DELETE FROM task_collaborators WHERE user_id = $1', [seedId]);
            await client.query('DELETE FROM task_assignments WHERE user_id = $1', [seedId]);
            await client.query('DELETE FROM memberships WHERE user_id = $1', [seedId]);
            await client.query('DELETE FROM users WHERE id = $1', [seedId]);
            console.log("Deleted old Seed User.");

            // 2. Update Real User to be God
            const updateRes = await client.query(
                `UPDATE users 
                 SET display_name = 'Christian Plyler', 
                     role = 'god',
                     email = 'christianplyler@gmail.com'
                 WHERE id = $1`,
                [realId]
            );
            console.log(`Updated Real User to God Mode: ${updateRes.rowCount}`);

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
