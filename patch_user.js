import { pool } from './server/index.js';

const patchUser = async () => {
    try {
        console.log('PATCHING USER...');
        // Updates the seed user to have the real email
        // preventing a duplicate 'new' user from being created.
        // The Auth Middleware will then 'Claim' this account for the real Firebase User.
        await pool.query(
            `UPDATE users 
             SET email = 'christianplyler@gmail.com' 
             WHERE email = 'christian@example.com'`
        );
        console.log('✅ Updated christian@example.com -> christianplyler@gmail.com');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
};

patchUser();
