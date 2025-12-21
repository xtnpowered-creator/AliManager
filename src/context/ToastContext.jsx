import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastStateContext = createContext([]);
const ToastActionsContext = createContext(null);

export const useToastState = () => {
    const context = useContext(ToastStateContext);
    if (context === undefined) throw new Error('useToastState must be used within a ToastProvider');
    return context;
};

export const useToast = () => {
    const context = useContext(ToastActionsContext);
    if (!context) throw new Error('useToast (Actions) must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [activeToast, setActiveToast] = useState(null);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        // Singleton Pattern: Replace existing toast immediately (Persistence)
        setActiveToast({ id, message, type });
    }, []);

    const removeToast = useCallback((id) => {
        setActiveToast(prev => (prev?.id === id ? null : prev));
    }, []);

    // Compatibility: Expose as array for existing consumers
    const toasts = useMemo(() => activeToast ? [activeToast] : [], [activeToast]);

    // Stable actions object
    const actions = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

    return (
        <ToastStateContext.Provider value={toasts}>
            <ToastActionsContext.Provider value={actions}>
                {children}
            </ToastActionsContext.Provider>
        </ToastStateContext.Provider>
    );
};
