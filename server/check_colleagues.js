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
        const orgId = '00000000-0000-0000-0000-111111111111';
        console.log(`Checking colleagues for Org: ${orgId}`);

        const res = await pool.query(
            "SELECT id, email, display_name FROM users WHERE organization_id = $1 AND role != 'god'",
            [orgId]
        );

        console.log(`Found ${res.rows.length} colleagues.`);
        res.rows.forEach(r => console.log(JSON.stringify(r)));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};
run();
