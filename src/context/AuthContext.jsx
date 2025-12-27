import React from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { apiClient } from '../api/client';

/**
 * AuthContext Module
 * 
 * Manages authentication state with environment-specific behavior.
 * 
 * Development Mode:
 * - Uses mock user system for easy testing
 * - No Firebase auth required (bypassed via headers)
 * - Stored mockUserId in localStorage determines active user
 * - switchUser() allows switching between preset mock users
 * - Defaults to Christian (god role) on first load
 * 
 * Production Mode:
 * - Uses Firebase authentication
 * - Listens for auth state changes via onAuthStateChanged
 * - Merges Firebase user data with backend user profile
 * - Real login/logout via Firebase Auth
 * 
 * User Caching:
 * - Stores user object in localStorage (USER_CACHE_KEY)
 * - Instant load on page refresh (prevents flash of logged-out state)
 * - Updates cache on every user change
 * 
 * User Object Structure:
 * ```js
 * {
 *   id: "uuid",           // From backend
 *   uid: "uuid",          // Firebase UID (or id in dev)
 *   name: "Full Name",
 *   displayName: "Full Name",
 *   role: "god|admin|user",
 *   email: "user@example.com",
 *   // ... other backend profile fields
 * }
 * ```
 * 
 * @module AuthContext
 */

const AuthContext = React.createContext();

export const useAuth = () => React.useContext(AuthContext);

/**
 * Mock Users for Development
 * Pre-defined test users with different roles and permissions
 */
export const MOCK_USERS = [
    { id: '9f449545-700a-4ce5-8dd5-4d221041e15e', name: 'Christian Plyler', role: 'god', label: 'Christian (Owner)' },
    { id: '11111111-0000-0000-0000-000000000002', name: 'Alisara Plyler', role: 'admin', label: 'Alisara (Purchasing Dir)' },
    { id: '11111111-0000-0000-0000-000000000003', name: 'Jenna Staff', role: 'user', label: 'Jenna (Purchasing Coord)' },
    { id: '11111111-0000-0000-0000-000000000004', name: 'Candice Staff', role: 'user', label: 'Candice (Purchasing Agent)' },
    { id: '11111111-0000-0000-0000-000000000005', name: 'Nick Staff', role: 'user', label: 'Nick (Purchasing Agent)' },
    { id: '11111111-0000-0000-0000-000000000006', name: 'Stuart Staff', role: 'user', label: 'Stuart (Lead Builder)' },
    { id: '11111111-0000-0000-0000-000000000007', name: 'Julie Staff', role: 'user', label: 'Julie (Sales Dir)' },
];

const USER_CACHE_KEY = 'cached_user_data';

export const AuthProvider = ({ children }) => {
    // Initialize from cache (prevents flash of logged-out state on refresh)
    const [user, setUser] = React.useState(() => {
        try {
            const cached = localStorage.getItem(USER_CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = React.useState(true);

    /**
     * Update user state and sync to localStorage cache
     */
    const updateUser = (userData) => {
        setUser(userData);
        if (userData) {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
        } else {
            localStorage.removeItem(USER_CACHE_KEY);
        }
    };

    /**
     * Development Only: Switch between mock users
     * Updates localStorage mockUserId and fetches new user data
     * 
     * @param {string} mockUserId - UUID of mock user to switch to
     */
    const switchUser = async (mockUserId) => {
        if (!import.meta.env.DEV) return;

        setLoading(true);
        if (mockUserId) {
            localStorage.setItem('mockUserId', mockUserId);
        } else {
            localStorage.removeItem('mockUserId');
        }

        // Fetch user profile from backend (will use mockUserId header)
        try {
            const res = await apiClient.get('/users/me');
            const userData = { ...res, uid: res.id, displayName: res.name };
            updateUser(userData);
            console.log("Switched to User:", res.name);
        } catch (err) {
            console.error("Failed to switch user:", err);
            if (!mockUserId) updateUser(null);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (import.meta.env.DEV) {
            // Development: Auto-login with mock user
            const storedMockId = localStorage.getItem('mockUserId');
            // Default to Christian (god) if no mock user stored
            if (!storedMockId) {
                switchUser(MOCK_USERS[0].id);
            } else {
                switchUser(storedMockId);
            }
            return () => { };
        }

        // Production: Firebase Auth Listener
        const unsubscribe = onAuthStateChanged(auth || {}, async (firebaseUser) => {
            if (firebaseUser) {
                // Merge Firebase auth data with backend user profile
                try {
                    const res = await apiClient.get('/users/me');
                    const userData = { ...firebaseUser, ...res, displayName: res.name || firebaseUser.displayName };
                    updateUser(userData);
                } catch (err) {
                    // Fallback: Use Firebase user if backend fetch fails
                    updateUser(firebaseUser);
                }
            } else {
                updateUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, switchUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
