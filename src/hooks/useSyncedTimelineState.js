import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useTimelineViewContext } from '../context/TimelineViewContext';

export const useSyncedTimelineState = (scrollContainerRef, days, getColumnWidth, isToday, scale, viewOffset = 0) => {
    const [isRestored, setIsRestored] = useState(false);
    const [syncedScale, setSyncedScale] = useState(null);
    const initialRestoreDone = useRef(false);
    const prevScale = useRef(scale); // Track scale for re-alignment reset

    // Use Context instead of LocalStorage
    // If context is unavailable (unlikely), silently fail or use local state? 
    // We assume context exists.
    const context = useTimelineViewContext();
    const { viewState, updateViewState } = context || {};

    const userInteracted = useRef(false);
    const setInteracted = useCallback(() => { userInteracted.current = true; }, []);

    // 1. Save State Logic (Debounced)
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || !updateViewState) return;

        // Block save if user hasn't interacted (prevents load-time drift loop)
        if (!userInteracted.current) return;

        const scrollLeft = scrollContainerRef.current.scrollLeft;
        // Search strictly based on ScrollLeft - ViewOffset + 350px.
        // Add 10px buffer to handle sub-pixel rounding errors (prevents jumping to previous day).
        const effectiveScrollLeft = Math.max(0, scrollLeft - viewOffset + 350 + 10);

        // Find date at this scroll position
        let currentOffset = 0;
        let leftDate = days[0];

        // Optimization: Rough estimate or strict loop? Strict loop is safest for variable widths.
        for (const day of days) {
            const width = getColumnWidth(day);
            if (currentOffset + width > effectiveScrollLeft) {
                leftDate = day;
                break;
            }
            currentOffset += width;
        }

        const newState = {
            date: leftDate.toISOString(),
            scale: scale, // Save Scale
            timestamp: Date.now()
        };

        updateViewState(newState);

    }, [scrollContainerRef, days, getColumnWidth, scale, updateViewState, viewOffset]);


    // 2. Attach Listener
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        let timeout;
        const onScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(handleScroll, 100);
        };

        const onInteract = () => {
            userInteracted.current = true;
        };

        el.addEventListener('scroll', onScroll);
        // Passive interaction listeners to unlock saving
        el.addEventListener('pointerdown', onInteract);
        el.addEventListener('wheel', onInteract);
        el.addEventListener('keydown', onInteract);
        el.addEventListener('touchstart', onInteract);

        return () => {
            el.removeEventListener('scroll', onScroll);
            el.removeEventListener('pointerdown', onInteract);
            el.removeEventListener('wheel', onInteract);
            el.removeEventListener('keydown', onInteract);
            el.removeEventListener('touchstart', onInteract);
            clearTimeout(timeout);
        };
    }, [handleScroll]);

    // 3. Re-Align on Scale Change (Fix for Wonky Jumps)
    useEffect(() => {
        const hasScaleChanged = prevScale.current !== scale;

        // Always update ref
        prevScale.current = scale;

        if (hasScaleChanged && isRestored && scrollContainerRef.current && viewState?.date) {
            const targetDate = new Date(viewState.date);
            const targetTime = targetDate.setHours(0, 0, 0, 0);

            let offset = 0;
            for (const day of days) {
                if (day.getTime() >= targetTime) break;
                offset += getColumnWidth(day);
            }

            // Snap to correct position (350px anchor)
            scrollContainerRef.current.scrollLeft = Math.max(0, offset + viewOffset - 350);
        }
    }, [scale, isRestored, days, getColumnWidth, viewState, viewOffset]);


    // 3. Restore State OR Scroll to Today (ONCE)
    // We only restore if context has data.
    // If context is empty, it means "Fresh Session" -> Default to Today.
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el || days.length === 0 || initialRestoreDone.current) return;

        initialRestoreDone.current = true; // Block future runs

        let targetOffset = -1;

        if (viewState && viewState.date) {
            // Context has state -> Restore
            const { date, scale: savedScale } = viewState;
            if (savedScale && setSyncedScale) setSyncedScale(savedScale);

            const targetDate = new Date(date);
            const targetTime = targetDate.setHours(0, 0, 0, 0);

            let offset = 0;
            for (const day of days) {
                if (day.getTime() >= targetTime) {
                    targetOffset = offset;
                    break;
                }
                // Use SAVED scale to calculate where the date WOULD be if we rendered it with that scale.
                // This prevents the mismatched 'current scale' from causing a jump.
                offset += getColumnWidth(day, savedScale);
            }
        }

        if (targetOffset !== -1) {
            // Found saved state
            // ScrollLeft = DayOffset + ViewOffset - 350.
            el.scrollLeft = Math.max(0, targetOffset + viewOffset - 350);
        } else {
            // Fallback: Scroll to Today (Default)
            // Use Saved Scale if available? Default to 10 effectively if not.
            // But if we are here, we didn't find saved state.
            const todayIndex = days.findIndex(d => isToday(d));
            if (todayIndex !== -1) {
                let offset = 0;
                for (let i = 0; i < todayIndex; i++) {
                    offset += getColumnWidth(days[i]); // Use current scale
                }
                // Align Today to Visual 350px
                el.scrollLeft = Math.max(0, offset + viewOffset - 350);
            }
        }

        setIsRestored(true);

    }, [days, getColumnWidth, isToday, viewState, viewOffset]); // Run when days ready. relies on ref to run once.

    return { isRestored, syncedScale, setInteracted };
};
