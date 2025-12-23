import React from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { apiClient } from '../api/client';

const AuthContext = React.createContext();

export const useAuth = () => React.useContext(AuthContext);

export const MOCK_USERS = [
    { id: '9f449545-700a-4ce5-8dd5-4d221041e15e', name: 'Christian Plyler', role: 'god', label: 'Christian (Owner)' },
    { id: '11111111-0000-0000-0000-000000000002', name: 'Alisara Plyler', role: 'admin', label: 'Alisara (Purchasing Dir)' },
    { id: '11111111-0000-0000-0000-000000000003', name: 'Jenna Staff', role: 'user', label: 'Jenna (Purchasing Coord)' },
    { id: '11111111-0000-0000-0000-000000000004', name: 'Candice Staff', role: 'user', label: 'Candice (Purchasing Agent)' },
    { id: '11111111-0000-0000-0000-000000000005', name: 'Nick Staff', role: 'user', label: 'Nick (Purchasing Agent)' },
    { id: '11111111-0000-0000-0000-000000000006', name: 'Stuart Staff', role: 'user', label: 'Stuart (Lead Builder)' },
    { id: '11111111-0000-0000-0000-000000000007', name: 'Julie Staff', role: 'user', label: 'Julie (Sales Dir)' },
];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    // DEV: Handle Mock User Switching
    const switchUser = async (mockUserId) => {
        if (!import.meta.env.DEV) return;

        setLoading(true);
        if (mockUserId) {
            localStorage.setItem('mockUserId', mockUserId);
        } else {
            localStorage.removeItem('mockUserId');
        }

        // Reload user data
        try {
            // Wait a tick for localStorage to propagate if needed (usually sync)
            const res = await apiClient.get('/users/me');
            setUser({ ...res, uid: res.id, displayName: res.name });
            console.log("Switched to User:", res.name);
        } catch (err) {
            console.error("Failed to switch user:", err);
            // Fallback: If 'me' fails (e.g. no mock ID), maybe logout?
            if (!mockUserId) setUser(null);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (import.meta.env.DEV) {
            // Initial Load for Dev Mode
            const storedMockId = localStorage.getItem('mockUserId');
            // Default to God if nothing stored
            if (!storedMockId) {
                switchUser(MOCK_USERS[0].id);
            } else {
                switchUser(storedMockId);
            }
            return;
        }

        // Production: Firebase Listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const res = await apiClient.get('/users/me');
                    setUser({ ...firebaseUser, ...res, displayName: res.name || firebaseUser.displayName });
                } catch (err) {
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
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
