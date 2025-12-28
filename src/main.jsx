import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './theme.css'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'

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
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </React.StrictMode>
    );
}
