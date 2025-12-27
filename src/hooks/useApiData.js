import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * useApiData Hook
 * 
 * Wrapper around React Query for standardized API data fetching with caching.
 * Provides backwards-compatible interface with setData for optimistic updates.
 * 
 * React Query Benefits:
 * - Automatic caching (prevents redundant API calls)
 * - Background refetching (keeps data fresh)
 * - Loading/error states managed automatically
 * - Deduplication (multiple components fetching same endpoint = 1 API call)
 * 
 * Query Key Structure:
 * ```
 * [endpoint, userId, ...dependencies]
 * ```
 * - Unique key per endpoint + user combination
 * - Dependencies array allows cache invalidation on prop changes
 * 
 * Backwards Compatibility:
 * - setData: Allows manual cache updates (optimistic updates)
 * - Supports both callback and direct value patterns
 * 
 * Example Usage:
 * ```js
 * const { data, loading, refetch, setData } = useApiData('/tasks');
 * 
 * // Optimistic update
 * setData(prev => [...prev, newTask]);
 * ```
 * 
 * @param {string} endpoint - API endpoint path (e.g., '/tasks', '/colleagues')
 * @param {Array} [dependencies=[]] - Additional cache key dependencies
 * @returns {Object} Query state and controls
 * @returns {Array} data - Fetched data (defaults to empty array)
 * @returns {boolean} loading - Loading state
 * @returns {Error|null} error - Error object if request failed
 * @returns {Function} refetch - Manually trigger refetch
 * @returns {Function} setData - Update cache (optimistic updates)
 */
export const useApiData = (endpoint, dependencies = []) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Query Key: Uniquely identifies this data (endpoint + user + dependencies)
    const queryKey = [endpoint, user?.uid || user?.id, ...dependencies].filter(Boolean);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            console.log(`[React Query] fetching ${endpoint}...`);
            const result = await apiClient.get(endpoint);
            console.log(`[React Query] success ${endpoint}`);
            return result;
        },
        enabled: !!user && !!endpoint, // Only fetch if user is logged in
        placeholderData: [], // Show empty array while loading (prevents undefined errors)
    });

    /**
     * Backwards Compatibility: setData
     * Allows manual optimistic updates by direct cache manipulation
     * Supports both callback pattern and direct value
     */
    const setData = (newData) => {
        // If function, handle callback pattern: setData(prev => [...prev, newItem])
        if (typeof newData === 'function') {
            queryClient.setQueryData(queryKey, (old) => newData(old || []));
        } else {
            // Direct value: setData([newArray])
            queryClient.setQueryData(queryKey, newData);
        }
    };

    return {
        data: data || [],     // Default to empty array (safe fallback)
        loading: isLoading,
        error,
        refetch,              // Force refetch from API
        setData               // Manual cache update
    };
};
