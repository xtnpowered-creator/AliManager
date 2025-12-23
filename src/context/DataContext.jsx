import React, { createContext, useContext, useMemo } from 'react';
import { useApiData } from '../hooks/useApiData';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    // 1. Fetch Core Data (Sequential Structure First)
    const { data: colleagues = [], loading: loadingColleagues, refetch: refetchColleagues } = useApiData('/colleagues');

    // Fetch Tasks only after colleagues structure is known (Optimistic logic)
    const shouldFetchTasks = !loadingColleagues && colleagues.length > 0;

    // Note: We use the same 'useApiData' hook but lift it here.
    // This ensures data is fetched once and held in memory.
    const {
        data: tasks = [],
        loading: loadingTasks,
        refetch: refetchTasks,
        setData: setTasks
    } = useApiData(shouldFetchTasks ? '/tasks' : null);

    const {
        data: projectsData = [],
        loading: loadingProjects,
        refetch: refetchProjects
    } = useApiData('/projects');

    // Aggregate Loading State
    // Note: We consider 'loading' true if critical data (Colleagues) is loading.
    // Tasks loading might be secondary depending on UX, but for now we track all.
    const loading = loadingColleagues || loadingTasks || loadingProjects;

    const value = useMemo(() => ({
        tasks,
        setTasks, // Exposed for optimistic updates
        refetchTasks,

        colleagues,
        refetchColleagues,

        projectsData,
        refetchProjects,

        loading
    }), [tasks, colleagues, projectsData, loading, refetchTasks, refetchColleagues, refetchProjects]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};
