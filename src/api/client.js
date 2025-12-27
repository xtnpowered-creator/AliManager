import { auth } from '../firebase';

/**
 * API Client Module
 * 
 * Centralized HTTP client for all backend API requests.
 * Handles authentication, environment-based routing, and god-mode bypass.
 * 
 * Environment Routing:
 * - Development (Vite): Points to local Firebase emulator (127.0.0.1:5001)
 * - Production: Uses relative '/api' path (proxied by Firebase Hosting)
 * 
 * Authentication Flow:
 * - Production: Attaches Firebase ID token via Authorization header
 * - Development: Skips token, relies on x-god-mode-bypass header
 * 
 * Special Headers:
 * - x-god-mode-bypass: Bypasses auth checks in development
 * - x-mock-user-id: Allows impersonating specific users (from localStorage)
 * 
 * Error Handling:
 * - Automatically parses error response body
 * - Falls back to generic HTTP status message if JSON parsing fails
 * - Throws Error object with descriptive message
 */

// Determine Base URL based on environment
const BASE_URL = import.meta.env.DEV
    ? 'http://127.0.0.1:5001/api' // Local Firebase emulator
    : '/api'; // Production (proxied by Firebase Hosting)

export const apiClient = {
    /**
     * Core request method (used by all convenience methods)
     * 
     * @param {string} endpoint - API endpoint path (e.g., '/tasks')
     * @param {Object} options - Fetch API options (method, headers, body, etc.)
     * @returns {Promise<Object>} Parsed JSON response
     * @throws {Error} If response is not OK (non-2xx status)
     */
    async request(endpoint, options = {}) {
        let token = null;

        // Fetch Firebase ID token (Production only)
        // Dev mode skips this to avoid auth complexity with emulator
        if (!import.meta.env.DEV && auth?.currentUser) {
            token = await auth.currentUser.getIdToken();
        }

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            // God-mode bypass: Allows dev testing without proper auth
            'x-god-mode-bypass': 'true',
            // Mock user: Impersonate specific user (stored in localStorage)
            'x-mock-user-id': localStorage.getItem('mockUserId') || undefined,
            ...options.headers, // Allow caller to override headers
        };

        console.log('[API CLIENT] Headers:', headers);

        const config = {
            ...options,
            headers,
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            // Attempt to parse error JSON, fall back to generic message
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    },

    /**
     * HTTP GET request
     * @param {string} endpoint - API endpoint path
     * @returns {Promise<Object>} Parsed JSON response
     */
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    /**
     * HTTP POST request
     * @param {string} endpoint - API endpoint path
     * @param {Object} body - Request body (will be JSON stringified)
     * @returns {Promise<Object>} Parsed JSON response
     */
    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    /**
     * HTTP PATCH request
     * @param {string} endpoint - API endpoint path
     * @param {Object} body - Request body (will be JSON stringified)
     * @returns {Promise<Object>} Parsed JSON response
     */
    patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },

    /**
     * HTTP DELETE request
     * @param {string} endpoint - API endpoint path
     * @returns {Promise<Object>} Parsed JSON response
     */
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};
