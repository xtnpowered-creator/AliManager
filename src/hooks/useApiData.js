import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const useApiData = (endpoint, dependencies = []) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Query Key uniquely identifies this data (endpoint + user + dependencies)
    const queryKey = [endpoint, user?.uid || user?.id, ...dependencies].filter(Boolean);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            console.log(`[React Query] fetching ${endpoint}...`);
            const result = await apiClient.get(endpoint);
            console.log(`[React Query] success ${endpoint}`);
            return result;
        },
        enabled: !!user && !!endpoint, // Only fetch if user logged in
        placeholderData: [], // Show empty array while loading
    });

    // Backwards Compatibility: "setData"
    // Allows manual optimistic updates by direct cache manipulation
    const setData = (newData) => {
        // If function, handle callback pattern
        if (typeof newData === 'function') {
            queryClient.setQueryData(queryKey, (old) => newData(old || []));
        } else {
            queryClient.setQueryData(queryKey, newData);
        }
    };

    return {
        data: data || [],
        loading: isLoading,
        error,
        refetch,
        setData
    };
};
