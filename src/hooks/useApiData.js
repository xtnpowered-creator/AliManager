import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const useApiData = (endpoint, dependencies = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshIndex, setRefreshIndex] = useState(0);
    const { user } = useAuth(); // Wait for user to be logged in before fetching

    useEffect(() => {
        if (!user) return; // Don't fetch if not logged in

        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await apiClient.get(endpoint);
                setData(result);
                setError(null);
            } catch (err) {
                console.error(`API Error (${endpoint}):`, err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint, user, refreshIndex, ...dependencies]);

    const refetch = () => setRefreshIndex(prev => prev + 1);

    return { data, loading, error, refetch };
};
