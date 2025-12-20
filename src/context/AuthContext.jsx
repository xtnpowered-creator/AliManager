import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { apiClient } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // For local development with emulators, we can auto-sign in anonymously or just monitor state
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch full profile from backend to sync Role, Company, Position
                    const res = await apiClient.get('/users/me');
                    // Merge Firebase properties with DB properties
                    // res contains the profile object directly (id, name, ...), not res.data
                    setUser({ ...firebaseUser, ...res, displayName: res.name || firebaseUser.displayName });
                } catch (err) {
                    console.error("AuthContext: Failed to sync user profile:", err);
                    setUser(firebaseUser); // Fallback to basic auth
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Auto sign-in if no user (convenient for local testing)
        if (!auth.currentUser && import.meta.env.DEV) {
            signInAnonymously(auth).catch(err => console.error("Auth emulator error:", err));
        }

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
