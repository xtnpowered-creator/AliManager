import { useState, useEffect } from 'react';

// Helper for safe local storage reading
const loadState = (key, defaultVal) => {
    if (typeof window === 'undefined') return defaultVal;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
    } catch (error) {
        console.warn('Error reading localStorage for key', key, error);
        return defaultVal;
    }
};

export const useFilterPersistence = (user) => {
    // Unique key per user to prevent data bleeding
    const storageKey = user ? `ali_manager_filters_${user.id || user.uid}` : null;

    const defaults = {
        searchText: '',
        colleagueFilters: [],
        taskFilters: [],
        projectFilters: [],
        sortConfig: { field: 'name', direction: 'asc' },
        hideEmptyRows: false
    };

    // -- State with Lazy Initialization --
    const [state, setState] = useState(() => {
        return storageKey ? loadState(storageKey, defaults) : defaults;
    });

    // -- Persistence Effect (Debounced) --
    useEffect(() => {
        if (!storageKey) return;
        const handler = setTimeout(() => {
            try {
                window.localStorage.setItem(storageKey, JSON.stringify(state));
            } catch (err) {
                console.error("Failed to save filters", err);
            }
        }, 500); // 500ms debounce
        return () => clearTimeout(handler);
    }, [state, storageKey]);

    const resetState = () => setState(defaults);

    // Setters
    const setters = {
        setSearchText: (val) => setState(prev => ({ ...prev, searchText: val })),
        setColleagueFilters: (val) => setState(prev => ({ ...prev, colleagueFilters: val })),
        setTaskFilters: (val) => setState(prev => ({ ...prev, taskFilters: val })),
        setProjectFilters: (val) => setState(prev => ({ ...prev, projectFilters: val })),
        setSortConfig: (val) => setState(prev => ({ ...prev, sortConfig: val })),
        setHideEmptyRows: (val) => setState(prev => ({ ...prev, hideEmptyRows: val })),
        resetAll: resetState
    };

    return { state, setters };
};
