import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * Global QueryClient instance for React Query caching and state management.
 * Used by QueryClientProvider in App.jsx to wrap the application.
 * 
 * Cache Strategy:
 * - staleTime: 5 minutes (data considered fresh, no refetch)
 * - cacheTime: 30 minutes (unused data kept in memory)
 * - refetchOnWindowFocus: disabled (prevents unnecessary refetches)
 * - retry: 1 attempt (fail faster, don't bombard server)
 * 
 * Why These Settings?
 * - 5min staleTime: Tasks/colleagues change infrequently, reduce API calls
 * - 30min cacheTime: Keep data available for quick navigation
 * - No window focus refetch: User clicking window doesn't invalidate data
 * - Single retry: Network issues usually persistent, fail fast
 * 
 * Usage:
 * - Consumed by useApiData hook (wraps useQuery)
 * - Provides automatic caching, deduplication, background refetching
 * - Enables optimistic updates via queryClient.setQueryData
 * 
 * @module queryClient
 */

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,      // Data fresh for 5 minutes
            cacheTime: 1000 * 60 * 30,      // Keep unused cache for 30 minutes
            refetchOnWindowFocus: false,    // Don't refetch on window focus
            retry: 1,                       // Single retry on failure
        },
    },
});
