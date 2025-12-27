import React from 'react';

/**
 * ToastContext Module
 * 
 * Manages toast notification state with singleton pattern.
 * Only one toast displayed at a time (new toasts replace existing ones).
 * 
 * Pattern: Split Context (State + Actions)
 * - ToastStateContext: Current toast array (for rendering)
 * - ToastActionsContext: Methods to show/remove toasts
 * - Why Split? Components that only show toasts don't re-render on toast changes
 * 
 * Singleton Behavior:
 * - showToast() replaces any existing toast immediately
 * - Prevents toast spam (rapid consecutive calls = only last toast shows)
 * - Single toast = cleaner UI, no vertical stacking issues
 * 
 * Auto-Dismiss:
 * - Duration parameter exists but handled by Navigation component
 * - Navigation.jsx sets timeout to call removeToast(id) after duration
 * - Default: 3000ms (3 seconds)
 * 
 * Compatibility:
 * - Exposes toasts as array (legacy reasons)
 * - Array always has 0 or 1 item (singleton pattern)
 * - Components can still map over array without breaking
 * 
 * Usage:
 * ```js
 * const { showToast } = useToast();
 * 
 * showToast('Task saved!', 'success', 3000);
 * showToast('Error occurred', 'error', 5000);
 * ```
 * 
 * @module ToastContext
 */

const ToastStateContext = React.createContext([]);
const ToastActionsContext = React.createContext(null);

/**
 * Hook to access toast state (active toasts array)
 * Used by components that render toasts (Navigation.jsx)
 */
export const useToastState = () => {
    const context = React.useContext(ToastStateContext);
    if (context === undefined) throw new Error('useToastState must be used within a ToastProvider');
    return context;
};

/**
 * Hook to access toast actions (showToast, removeToast)
 * Used by components that trigger toasts
 */
export const useToast = () => {
    const context = React.useContext(ToastActionsContext);
    if (!context) throw new Error('useToast (Actions) must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [activeToast, setActiveToast] = React.useState(null);

    /**
     * Show a toast notification
     * Replaces existing toast immediately (singleton pattern)
     * 
     * @param {string} message - Toast message text
     * @param {string} [type='info'] - Toast type: 'success', 'error', 'info'
     * @param {number} [duration=3000] - Auto-dismiss duration (handled by Navigation)
     */
    const showToast = React.useCallback((message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        // Singleton: Replace existing toast
        setActiveToast({ id, message, type });
    }, []);

    /**
     * Remove specific toast by ID
     * Only removes if ID matches current active toast
     */
    const removeToast = React.useCallback((id) => {
        setActiveToast(prev => (prev?.id === id ? null : prev));
    }, []);

    // Compatibility: Expose as array (0 or 1 items)
    const toasts = React.useMemo(() => activeToast ? [activeToast] : [], [activeToast]);

    // Stable actions object (prevents re-renders)
    const actions = React.useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

    return (
        <ToastStateContext.Provider value={toasts}>
            <ToastActionsContext.Provider value={actions}>
                {children}
            </ToastActionsContext.Provider>
        </ToastStateContext.Provider>
    );
};
