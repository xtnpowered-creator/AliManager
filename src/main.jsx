import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

/**
 * Application Entry Point
 * 
 * Initializes React app and mounts to DOM.
 * 
 * Provider Order (Critical):
 * 1. ToastProvider (outermost) - Toast state available everywhere
 * 2. AuthProvider - Auth state needed before routing/data fetching
 * 3. App - Contains all other providers (Router, QueryClient, etc.)
 * 
 * Why Toast/Auth Here vs in App.jsx?
 * - ToastProvider: Navigation component (outside Shell) needs toast context
 * - AuthProvider: Authentication needed before Router initializes
 * - App.jsx handles providers that need routing context
 * 
 * StrictMode:
 * - Enables additional development checks
 * - Double-invokes component effects (catches side-effect bugs)
 * - Disabled in production build automatically
 * 
 * Console Logging:
 * - Debug statements for mount sequence verification
 * - Helps diagnose render/mount issues during development
 * - Safe to leave in production (minimal overhead)
 * 
 * Error Handling:
 * - Checks for root element existence
 * - Fails gracefully with error message if DOM not ready
 * - Prevents silent failures in production
 */

console.log("[MAIN] Starting App...");

const rootElement = document.getElementById('root');
console.log("[MAIN] Root Element:", rootElement);

if (!rootElement) {
    console.error("[MAIN] FATAL: Root element not found!");
} else {
    console.log("[MAIN] Root found, mounting React...");
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            {console.log("[MAIN] Rendering Providers...")}
            <ToastProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ToastProvider>
        </React.StrictMode>
    );
}
