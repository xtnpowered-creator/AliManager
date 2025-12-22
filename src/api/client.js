import { auth } from '../firebase';

// Determine Base URL based on environment (local vs production)
// For local development with Vite proxy (see firebase.json rewrites or Vite config),
// we might point to /api if using proxy, or directly to function URL.
// Since we set up firebase.json rewrites, relative path /api *should* work if served via Firebase Hosting.
// BUT for Vite dev server, we need to proxy endpoint or point to localhost:5001/api if emulating.
// Let's assume vite proxy is set up or we use direct URL for now.
// Actually, standard Fetch to '/api/...' works if Vite proxies it.

// const BASE_URL = import.meta.env.VITE_API_URL || '/api'; 
// Better approach: Point to local function emulator for Dev
const BASE_URL = import.meta.env.DEV
    ? 'http://127.0.0.1:5001/api'
    : '/api';

export const apiClient = {
    async request(endpoint, options = {}) {
        let token = null;
        // In PROD: Get real token. In DEV: Skip to rely on x-god-mode-bypass header.
        if (auth.currentUser && !import.meta.env.DEV) {
            token = await auth.currentUser.getIdToken();
        }

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(import.meta.env.DEV ? {
                'x-god-mode-bypass': 'true',
                'x-mock-user-id': localStorage.getItem('mockUserId') || undefined
            } : {}),
            ...options.headers,
        };

        const config = {
            ...options,
            headers,
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};
