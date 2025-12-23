import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../api/client';
import { useDataContext } from '../../context/DataContext';

export const useTimelineData = (user) => {
    // 1. Consume Global Data (Cached)
    const {
        tasks, setTasks, refetchTasks,
        colleagues,
        projectsData,
        loading
    } = useDataContext();
    const [delegations, setDelegations] = useState([]);

    // Fetch Delegations if Admin
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'god')) {
            apiClient.get('/delegations')
                .then(setDelegations)
                .catch(err => console.error('Failed to fetch delegations:', err));
        }
    }, [user]);

    // Create handy map
    const delegationMap = useMemo(() => new Map(delegations.map(d => [d.delegate_id, d])), [delegations]);

    return {
        tasks,
        setTasks, // Exposed for optimistic updates
        refetchTasks,
        colleagues,
        projectsData,
        loading,
        delegations,
        setDelegations,
        delegationMap
    };
};
