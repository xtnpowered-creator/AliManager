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
        // FORCE GOD MODE (Frontend Bypass for Dev)
        if (import.meta.env.DEV) {
            const godUser = {
                id: '9f449545-700a-4ce5-8dd5-4d221041e15e',
                name: 'Christian Plyler',
                displayName: 'Christian Plyler', // For Frontend
                display_name: 'Christian Plyler', // For DB Compat
                email: 'xtnpowered@gmail.com',
                role: 'god',
                organization_id: '00000000-0000-0000-0000-111111111111',
                position: 'Owner', // Retrieved from DB
                avatar_url: null,
                isDelegated: false
            };
            // DEV MODE: Instant "God" Login
            // The Backend accepts 'x-god-mode-bypass' header (see client.js)
            console.log("DEV MODE: Forcing Frontend God User", godUser);
            setUser(godUser);
            setLoading(false);
            return; // EXIT: Do not attach Firebase listener
        }

        // For Production: Standard Auth
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const res = await apiClient.get('/users/me');
                    setUser({ ...firebaseUser, ...res, displayName: res.name || firebaseUser.displayName });
                } catch (err) {
                    console.error("AuthContext: Failed to sync user profile:", err);
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
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
