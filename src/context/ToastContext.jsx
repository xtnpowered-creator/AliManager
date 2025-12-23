import React from 'react';

const ToastStateContext = React.createContext([]);
const ToastActionsContext = React.createContext(null);

export const useToastState = () => {
    const context = React.useContext(ToastStateContext);
    if (context === undefined) throw new Error('useToastState must be used within a ToastProvider');
    return context;
};

export const useToast = () => {
    const context = React.useContext(ToastActionsContext);
    if (!context) throw new Error('useToast (Actions) must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [activeToast, setActiveToast] = React.useState(null);

    const showToast = React.useCallback((message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        // Singleton Pattern: Replace existing toast immediately (Persistence)
        setActiveToast({ id, message, type });
    }, []);

    const removeToast = React.useCallback((id) => {
        setActiveToast(prev => (prev?.id === id ? null : prev));
    }, []);

    // Compatibility: Expose as array for existing consumers
    const toasts = React.useMemo(() => activeToast ? [activeToast] : [], [activeToast]);

    // Stable actions object
    const actions = React.useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

    return (
        <ToastStateContext.Provider value={toasts}>
            <ToastActionsContext.Provider value={actions}>
                {children}
            </ToastActionsContext.Provider>
        </ToastStateContext.Provider>
    );
};
