import express from 'express';
import cors from 'cors';
import { app } from './index.js';

const devServer = express();
const PORT = 5001;

devServer.use(cors({ origin: true }));

// Mount at the Emulator path so client.js works unchanged
devServer.use('/ali-manager-local/us-central1/api', app);

// Also mount at /api for easier browser testing
devServer.use('/api', app);

devServer.listen(PORT, () => {
    console.log(`[Dev] Server running on port ${PORT}`);
    console.log(`[Dev] Emulator Path: http://localhost:${PORT}/ali-manager-local/us-central1/api`);
    console.log(`[Dev] Short Path:    http://localhost:${PORT}/api`);
});
