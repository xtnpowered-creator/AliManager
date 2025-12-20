import { pool } from './server/index.js';

const debugUsers = async () => {
    try {
        console.log('--- USERS ---');
        const res = await pool.query('SELECT id, email, role, organization_id, firebase_uid FROM users');
        console.table(res.rows);

        console.log('\n--- ORGANIZATIONS ---');
        const orgs = await pool.query('SELECT * FROM organizations');
        console.table(orgs.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

debugUsers();
