import pg from 'pg';
const { Pool } = pg;

/**
 * PostgreSQL Database Connection Pool
 * 
 * PURPOSE:
 * Provides database connection for server-side scripts (seed data, migrations, etc.).
 * 
 * CONFIGURATION:
 * - Local development only (trusted auth, no password)
 * - Port 5433 (non-standard to avoid conflicts)
 * - Database: alimanager
 * 
 * USAGE:
 * Import { query } and use for raw SQL queries.
 * Not used in client-side code (Firebase handles that).
 * 
 * @example
 * import { query } from './db.js';
 * const result = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
 */
// Configuration for Local Postgres
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'alimanager',
    password: '', // Trusted auth for local dev
    port: 5433,
});

export const query = (text, params) => pool.query(text, params);
export const end = () => pool.end();
