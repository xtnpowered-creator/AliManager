import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../api/client';
import { useDataContext } from '../../context/DataContext';

/**
 * useTimelineData Hook
 * 
 * Data layer for timeline views. Aggregates global cached data from DataContext
 * and fetches admin-specific delegations.
 * 
 * Architecture:
 * - Leverages DataContext for tasks, colleagues, projects (shared/cached globally)
 * - Fetches delegations separately (admin-only, not in global cache)
 * - Creates delegation lookup map for O(1) access by delegate_id
 * 
 * Why DataContext?
 * - Prevents redundant API calls across multiple views
 * - Ensures data consistency (single source of truth)
 * - Managed refetch coordination (e.g., after task create/update)
 * 
 * Delegation Map:
 * - Converts array to Map for fast lookup: delegationMap.get(delegate_id)
 * - Used to display admin badges, special permissions
 * - Only populated for admin/god users
 * 
 * @param {Object} user - Current user object (to check role)
 * @returns {Object} Data layer with tasks, colleagues, projects, delegations
 */
export const useTimelineData = (user) => {
    // 1. Consume Global Data (Cached in DataContext)
    const {
        tasks, setTasks, refetchTasks,
        colleagues,
        projectsData,
        loading
    } = useDataContext();

    const [delegations, setDelegations] = useState([]);

    // 2. Fetch Delegations (Admin-only feature)
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'god')) {
            apiClient.get('/delegations')
                .then(setDelegations)
                .catch(err => console.error('Failed to fetch delegations:', err));
        }
    }, [user]);

    // 3. Create Delegation Lookup Map (O(1) access by delegate_id)
    const delegationMap = useMemo(() => new Map(delegations.map(d => [d.delegate_id, d])), [delegations]);

    return {
        tasks,
        setTasks,        // Exposed for optimistic updates in actions layer
        refetchTasks,    // Force refetch after mutations
        colleagues,
        projectsData,
        loading,
        delegations,
        setDelegations,
        delegationMap    // Fast lookup for delegation info
    };
};
