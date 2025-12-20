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

async function forceGodMode() {
    try {
        console.log('🔌 Connecting to DB...');
        const client = await pool.connect();

        console.log('🔍 Finding user with email christianplyler@gmail.com...');
        // We also check for 'christian@example.com' just in case the patch didn't stick
        const findRes = await client.query(`
            SELECT * FROM users 
            WHERE email ILIKE '%christian%' OR email ILIKE '%xtn%'
        `);

        if (findRes.rows.length === 0) {
            console.log('❌ No matching user found!');
        } else {
            console.log(`✅ Found ${findRes.rows.length} users.`);
            for (const user of findRes.rows) {
                console.log(`   - Updating User: ${user.email} (Current Role: ${user.role})`);
                await client.query(`UPDATE users SET role = 'god' WHERE id = $1`, [user.id]);
                console.log(`   ✨ Updated to GOD role.`);
            }
        }

        client.release();
        await pool.end();
        console.log('👋 Done.');
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

forceGodMode();
