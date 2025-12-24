import React, { createContext, useContext, useRef, useCallback } from 'react';

const TimelineRegistryContext = createContext(null);

export const TimelineRegistryProvider = ({ children }) => {
    // Map of ID -> { id, element, rect }
    // We use a Ref for the Map so updating it doesn't trigger re-renders of the provider
    const registryRef = useRef(new Map());

    const registerTask = useCallback((id, element) => {
        if (!id || !element) return;

        // We defer rect calculation to the selection phase or use ResizeObserver if highly dynamic.
        // For now, just storing the element reference is enough to lazily get rects during selection
        // without querySelectorAll.
        registryRef.current.set(id, { id, element });
    }, []);

    const unregisterTask = useCallback((id) => {
        registryRef.current.delete(id);
    }, []);

    const getTasks = useCallback(() => {
        return registryRef.current;
    }, []);

    return (
        <TimelineRegistryContext.Provider value={{ registerTask, unregisterTask, getTasks }}>
            {children}
        </TimelineRegistryContext.Provider>
    );
};

export const useTimelineRegistry = () => {
    const context = useContext(TimelineRegistryContext);
    if (!context) {
        throw new Error('useTimelineRegistry must be used within a TimelineRegistryProvider');
    }
    return context;
};
