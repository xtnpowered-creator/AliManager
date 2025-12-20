import fs from 'fs';
import path from 'path';
import { pool } from './server/index.js';

async function applyExtraSeed() {
    try {
        const seedPath = path.join(process.cwd(), 'extra_seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('🌱 Applying Extra Seed Data...');
        await pool.query(seedSql);
        console.log('✅ Extra Seed applied successfully!');
    } catch (err) {
        console.error('❌ Seed failed:', err);
    } finally {
        await pool.end();
    }
}

applyExtraSeed();
