import fs from 'fs';
import path from 'path';
import { pool } from './server/index.js';

async function applySeed() {
    try {
        const seedPath = path.join(process.cwd(), 'seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('🌱 Application Seed Data...');
        await pool.query(seedSql);
        console.log('✅ Seed applied successfully!');
    } catch (err) {
        console.error('❌ Seed failed:', err);
    } finally {
        await pool.end();
    }
}

applySeed();
