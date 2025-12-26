import React from 'react';
import { useAuth } from './AuthContext';

const TimelineViewContext = React.createContext();

export const TimelineViewProvider = ({ children }) => {
    const { user } = useAuth();
    const userIdRef = React.useRef(user?.uid);
    const STORAGE_KEY = `timeline_view_state_${user?.uid || 'default'}`;

    // Initialize from LocalStorage
    const [viewState, setViewState] = React.useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            console.log("TimelineContext: Loaded Initial State:", parsed); // LOG
            return parsed;
        } catch (err) {
            console.error("Failed to load timeline state", err);
            return null;
        }
    });

    // Reload state when user changes
    React.useEffect(() => {
        if (userIdRef.current !== user?.uid) {
            userIdRef.current = user?.uid;
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : null;
                console.log("TimelineContext: User changed, reloading state:", parsed);
                setViewState(parsed);
            } catch (err) {
                console.error("Failed to reload timeline state", err);
                setViewState(null);
            }
        }
    }, [user?.uid, STORAGE_KEY]);

    // Save to LocalStorage on Change
    React.useEffect(() => {
        if (viewState) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(viewState));
            // console.log("TimelineContext: Saved State", viewState); // Too noisy?
        }
    }, [viewState]);

    const updateViewState = React.useCallback((newState) => {
        setViewState(prev => {
            const updated = { ...prev, ...newState };
            // console.log("TimelineContext: Update Requested", newState, "Result:", updated);
            return updated;
        });
    }, []);

    return (
        <TimelineViewContext.Provider value={{ viewState, updateViewState }}>
            {children}
        </TimelineViewContext.Provider>
    );
};

export const useTimelineViewContext = () => {
    const context = React.useContext(TimelineViewContext);
    if (context === undefined) {
        throw new Error('useTimelineViewContext must be used within a TimelineViewProvider');
    }
    return context;
};
