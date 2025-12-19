import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

// Initialize Firebase Admin (for Auth checks later)
// Try/Catch to avoid double init in some HMR scenarios
if (!admin.apps.length) {
    admin.initializeApp();
}

dotenv.config();

const { Pool } = pg;

// 1. Database Connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alimanager',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
});

// 2. Express App Setup
const app = express();
app.use(cors({ origin: true })); // Allow all requests (refine for prod later)
app.use(express.json());

// 3. Middleware: Logging
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

// Import Middleware & Routes dynamically (or at top)
import { createAuthMiddleware } from './src/middleware/auth.js';
import { createProjectsRouter } from './src/routes/projects.js';
import { createTasksRouter } from './src/routes/tasks.js';
import { createUsersRouter } from './src/routes/users.js';

// Mount Protected Routes
const authMiddleware = createAuthMiddleware(pool);
app.use('/projects', authMiddleware, createProjectsRouter(pool));
app.use('/tasks', authMiddleware, createTasksRouter(pool));
app.use('/users', authMiddleware, createUsersRouter(pool));
// Legacy/Alias for consistency with frontend 'colleagues'
app.use('/colleagues', authMiddleware, createUsersRouter(pool));

// 4. Routes
app.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as now');
        res.json({
            status: 'ok',
            timestamp: result.rows[0].now,
            service: 'AliManager Express API'
        });
    } catch (err) {
        console.error('DB Health Check Failed:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Export as Cloud Function
// This maps to /api/** in firebase.json rewrites
export const api = onRequest(app);

// Export for local dev server
export { app, pool };
