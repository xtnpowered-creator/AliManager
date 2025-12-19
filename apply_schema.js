import fs from 'fs';
import path from 'path';
import { pool } from './server/index.js';

const runMigration = async () => {
    try {
        const sqlPath = path.join(process.cwd(), 'server', 'setup_viral_loop.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying Viral Loop schema...');
        await pool.query(sql);
        console.log('Successfully applied Viral Loop schema.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

runMigration();
