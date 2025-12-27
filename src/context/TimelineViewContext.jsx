import React from 'react';

/**
 * TimelineViewContext Module
 * 
 * Manages timeline scroll position persistence across sessions.
 * Saves/restores scroll state (date + scale) to localStorage per user.
 * 
 * State Structure:
 * ```js
 * {
 *   date: "2025-12-27T00:00:00.000Z",  // ISO date string at anchor point
 *   gridOffset: 1234.56,                 // Pixel offset from virtualStartDate
 *   scale: 96,                           // Pixels per weekday column
 *   timestamp: 1703692800000             // When state was saved
 * }
 * ```
 * 
 * Why Per-User?
 * - Each user has different workflow preferences
 * - Storage key includes user ID: `timeline_view_state_${userId}`
 * - Prevents state collision when switching mock users in dev
 * 
 * State Lifecycle:
 * 1. Mount: Load from localStorage (or null if first visit)
 * 2. User scrolls: useSyncedTimelineState calls updateViewState
 * 3. State changes: Auto-save to localStorage via useEffect
 * 4. User switches: Reload state for new user
 * 
 * User Switch Handling:
 * - Watches user?.uid via useEffect
 * - On change: Reload state from new user's storage key
 * - Prevents wrong user's scroll position from persisting
 * 
 * Consumer Pattern:
 * ```js
 * const { viewState, updateViewState } = useTimelineViewContext();
 * 
 * // Read saved state
 * if (viewState?.date) {
 *   scrollToDate(new Date(viewState.date));
 * }
 * 
 * // Update state
 * updateViewState({ date: newDate.toISOString(), scale: newScale });
 * ```
 * 
 * @module TimelineViewContext
 */

import { useAuth } from './AuthContext';

const TimelineViewContext = React.createContext();

export const TimelineViewProvider = ({ children }) => {
    const { user } = useAuth();
    const userIdRef = React.useRef(user?.uid);
    const STORAGE_KEY = `timeline_view_state_${user?.uid || 'default'}`;

    // Initialize from localStorage (per-user)
    const [viewState, setViewState] = React.useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            console.log("TimelineContext: Loaded Initial State:", parsed);
            return parsed;
        } catch (err) {
            console.error("Failed to load timeline state", err);
            return null;
        }
    });

    // Reload state when user changes (e.g., switching mock users in dev)
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

    // Auto-save to localStorage on state change
    React.useEffect(() => {
        if (viewState) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(viewState));
            // console.log("TimelineContext: Saved State", viewState); // Verbose in production
        }
    }, [viewState, STORAGE_KEY]);

    /**
     * Update view state (partial merge)
     * Merges new state with existing state, preserving unmodified fields
     */
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

/**
 * Hook to access TimelineViewContext
 * Throws error if used outside TimelineViewProvider
 */
export const useTimelineViewContext = () => {
    const context = React.useContext(TimelineViewContext);
    if (context === undefined) {
        throw new Error('useTimelineViewContext must be used within a TimelineViewProvider');
    }
    return context;
};
