
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
        console.log('Checking for department column...');

        // Add department column if not exists
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='department') THEN 
                    ALTER TABLE users ADD COLUMN department VARCHAR(255); 
                END IF; 
            END $$;
        `);

        console.log('Schema update complete.');

        // Verify
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('Current columns:', res.rows.map(r => r.column_name));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
};

run();
