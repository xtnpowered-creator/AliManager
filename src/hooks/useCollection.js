import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * useCollection Hook
 * 
 * Real-time Firestore collection listener with auto-updates.
 * Legacy hook - app now primarily uses REST API via useApiData.
 * 
 * Current Status:
 * - Bypassed in development (returns empty data)
 * - Production: Would connect to Firestore (if enabled)
 * - Most data fetching migrated to useApiData + backend API
 * 
 * Why Bypassed in Dev?
 * - App architecture shifted to backend API (Cloud Functions)
 * - Firestore used only for specific real-time features (if any)
 * - Prevents errors when Firestore emulator not running
 * 
 * Features (Production):
 * - Real-time updates via onSnapshot
 * - Optional orderBy for sorted collections
 * - Auto-cleanup on unmount
 * - Loading and error states
 * 
 * Usage Pattern:
 * ```js
 * const { data, loading, error } = useCollection('tasks', 'createdAt');
 * 
 * // data updates automatically when Firestore changes
 * ```
 * 
 * Migration Note:
 * - Consider deprecating if all data moved to REST API
 * - Or keep for specific real-time features (chat, notifications)
 * 
 * @param {string} collectionName - Firestore collection name
 * @param {string} [orderByField=null] - Field to sort by
 * @returns {Object} Collection data and state
 * @returns {Array} data - Array of documents with id
 * @returns {boolean} loading - Loading state
 * @returns {Error|null} error - Error object if failed
 */
export const useCollection = (collectionName, orderByField = null) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Dev Mode Bypass (app uses API, not Firestore directly)
        if (import.meta.env.DEV) {
            console.warn(`[useCollection] Bypassing Firestore fetch for ${collectionName}`);
            setLoading(false);
            return;
        }

        // Production: Real-time Firestore listener
        let q = query(collection(db, collectionName));

        if (orderByField) {
            q = query(collection(db, collectionName), orderBy(orderByField));
        }

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setData(list);
                setLoading(false);
            },
            (err) => {
                console.error(`Error fetching ${collectionName}:`, err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, orderByField]);

    return { data, loading, error };
};
