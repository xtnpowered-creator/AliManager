import React from 'react';

const TimelineViewContext = React.createContext();

const STORAGE_KEY = 'timeline_view_state';

export const TimelineViewProvider = ({ children }) => {
    // Initialize from LocalStorage
    const [viewState, setViewState] = React.useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error("Failed to load timeline state", err);
            return null;
        }
    });

    // Save to LocalStorage on Change
    React.useEffect(() => {
        if (viewState) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(viewState));
        }
    }, [viewState]);

    const updateViewState = React.useCallback((newState) => {
        setViewState(prev => ({ ...prev, ...newState }));
    }, []);

    return (
        <TimelineViewContext.Provider value={{ viewState, updateViewState }}>
            {children}
        </TimelineViewContext.Provider>
    );
};

export const useTimelineViewContext = () => React.useContext(TimelineViewContext);
