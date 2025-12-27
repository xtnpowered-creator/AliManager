import React from 'react';

/**
 * ErrorBoundary Component
 * 
 * React error boundary that catches JavaScript errors in child component tree.
 * Displays fallback UI when errors occur, preventing full app crashes (WSOD).
 * 
 * How It Works:
 * 1. Wraps component tree in App.jsx
 * 2. If any child component throws error during render/lifecycle/constructor
 * 3. ErrorBoundary catches it and displays error details
 * 4. Logs full error + component stack to console for debugging
 * 
 * Note: Does NOT catch:
 * - Event handler errors (use try/catch)
 * - Async code errors (use .catch())
 * - Server-side rendering errors
 * - Errors in the ErrorBoundary itself
 * 
 * Static Methods:
 * - getDerivedStateFromError: Updates state to trigger fallback UI
 * - componentDidCatch: Logs error details to console
 * 
 * @class
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    /**
     * Update state when error is caught (triggers fallback UI render)
     */
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    /**
     * Log error details to console for debugging
     * Stores error info in state for display
     */
    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI: Red error box with expandable details
            return (
                <div style={{ padding: '20px', color: 'red', border: '2px solid red' }}>
                    <h1>Something went wrong.</h1>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
