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

/**
 * Filter Persistence Hook
 * 
 * PURPOSE:
 * Persists filter, sort, and search state to browser localStorage.
 * Allows users to close browser and return to same filter state later.
 * 
 * PER-USER STORAGE:
 * Each user gets unique localStorage key: `ali_manager_filters_{userId}`
 * 
 * WHY:
 * - Prevents data bleeding between users on shared devices
 * - Allows user-specific filter preferences
 * - Example: User A always filters by "Engineering" dept, User B never does
 * 
 * STATE MANAGED:
 * - searchText: Global search input value
 * - colleagueFilters: Array of people filters (dept, position)
 * - taskFilters: Array of task filters (status, priority, due date)
 * - projectFilters: Array of project filters (client, status)
 * - sortConfig: { field: 'name'|'position'|'taskCount', direction: 'asc'|'desc' }
 * - hideEmptyRows: Boolean toggle for empty row visibility
 * 
 * DEBOUNCED SAVE:
 * - Saves to localStorage 500ms after last state change
 * - Prevents excessive writes during rapid filter changes
 * - Example: User types "eng" → wait 500ms → save (not 3 writes for e, n, g)
 * 
 * LAZY INITIALIZATION:
 * useState(() => loadState(...)) ensures localStorage read happens ONCE on mount.
 * Avoids reading localStorage on every render (performance optimization).
 * 
 * SSR SAFETY:
 * - Checks `typeof window === 'undefined'` before accessing localStorage
 * - Returns defaults if running on server (Next.js, etc.)
 * - Prevents crashes during server-side rendering
 * 
 * ERROR HANDLING:
 * - Try/catch around JSON.parse() prevents corrupt data crashes
 * - Falls back to defaults if localStorage read/write fails
 * - Logs warnings for debugging but doesn't break app
 * 
 * SETTERS PATTERN:
 * All setters use React's functional update pattern:
 * `setState(prev => ({ ...prev, newField: newValue }))`
 * 
 * Ensures immutability and predictable state updates.
 * 
 * @param {Object} user - Current user object (requires: id or uid)
 * @returns {Object} { state, setters }
 *   - state: Current filter state object
 *   - setters: Object with setter functions + resetAll
 * 
 * @example
 * const { state, setters } = useFilterPersistence(currentUser);
 * 
 * // Read state
 * console.log(state.taskFilters); // [{ type: 'status', value: 'done' }]
 * 
 * // Update state
 * setters.setTaskFilters([...state.taskFilters, newFilter]);
 * setters.setSortConfig({ field: 'taskCount', direction: 'desc' });
 * 
 * // Reset all
 * setters.resetAll(); // Clears all filters, resets sort to defaults
 */
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
