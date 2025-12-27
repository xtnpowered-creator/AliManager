import React, { createContext, useContext, useMemo } from 'react';
import { useApiData } from '../hooks/useApiData';

/**
 * DataContext Module
 * 
 * Global data provider that manages shared data fetching and caching.
 * Prevents redundant API calls across components by providing centralized data access.
 * 
 * Why DataContext?
 * - Single Source of Truth: All components consume same data instance
 * - React Query Caching: Leverages useApiData's built-in caching
 * - Optimistic Updates: Exposes setTasks for instant UI updates
 * - Coordinated Refetching: Single refetch method invalidates cache everywhere
 * 
 * Data Fetched:
 * 1. Colleagues (team members/users)
 * 2. Tasks (all tasks across all colleagues)
 * 3. Projects (project metadata)
 * 
 * Loading Strategy:
 * - Colleagues load first (essential for structure)
 * - Tasks load only after colleagues exist (prevents orphaned data)
 * - Projects load in parallel
 * - Aggregate loading state = any critical data still loading
 * 
 * Usage Pattern:
 * ```js
 * const { tasks, colleagues, loading, refetchTasks } = useDataContext();
 * 
 * // Optimistic update
 * setTasks(prev => [...prev, newTask]);
 * 
 * // Force refetch (e.g., after mutations)
 * refetchTasks();
 * ```
 * 
 * @module DataContext
 */

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    // 1. Fetch Colleagues First (critical for app structure)
    const { data: colleagues = [], loading: loadingColleagues, refetch: refetchColleagues } = useApiData('/colleagues');

    // 2. Fetch Tasks only after colleagues loaded (prevents orphaned tasks)
    const shouldFetchTasks = !loadingColleagues && colleagues.length > 0;
    const {
        data: tasks = [],
        loading: loadingTasks,
        refetch: refetchTasks,
        setData: setTasks // Exposed for optimistic updates
    } = useApiData(shouldFetchTasks ? '/tasks' : null);

    // 3. Fetch Projects in parallel
    const {
        data: projectsData = [],
        loading: loadingProjects,
        refetch: refetchProjects
    } = useApiData('/projects');

    // Aggregate Loading State (true if any critical data still loading)
    const loading = loadingColleagues || loadingTasks || loadingProjects;

    // Memoize value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        tasks,
        setTasks,        // Optimistic update method
        refetchTasks,    // Force refetch from API

        colleagues,
        refetchColleagues,

        projectsData,
        refetchProjects,

        loading          // Aggregate loading state
    }), [tasks, colleagues, projectsData, loading, refetchTasks, refetchColleagues, refetchProjects, setTasks]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

/**
 * Hook to access DataContext
 * Throws error if used outside DataProvider (prevents undefined context bugs)
 */
export const useDataContext = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};
