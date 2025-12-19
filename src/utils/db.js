import pg from 'pg';
const { Pool } = pg;

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
