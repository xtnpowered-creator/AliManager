import { useState, useEffect, useCallback, useRef } from 'react';
import { useTimelineViewContext } from '../context/TimelineViewContext';
import { getPixelOffsetFromStart, getDateFromPixelOffset } from '../utils/timelineMath';

export const useSyncedTimelineState = (
    scrollContainerRef,
    virtualStartDate,
    scale,
    viewOffset = 0,
    anchorOffset = 350,
    sidebarWidth = 0
) => {
    const [isRestored, setIsRestored] = useState(false);
    const [syncedScale, setSyncedScale] = useState(null);
    const initialRestoreDone = useRef(false);
    const prevScale = useRef(scale);

    const context = useTimelineViewContext();
    const { viewState, updateViewState } = context || {};

    const userInteracted = useRef(false);
    const setInteracted = useCallback(() => { userInteracted.current = true; }, []);

    // 1. Save State Logic
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || !updateViewState || !virtualStartDate) return;
        if (!userInteracted.current) return;

        const scrollLeft = scrollContainerRef.current.scrollLeft;

        // Calculate which date's LEFT EDGE is at the anchor point
        // Grid position = scrollLeft + anchorOffset - sidebarWidth
        // CRITICAL FIX: Round to nearest pixel to avoid off-by-one errors
        const gridPixelAtAnchor = Math.round(scrollLeft + anchorOffset - sidebarWidth);

        // Get the date that contains this pixel
        const currentDate = getDateFromPixelOffset(Math.max(0, gridPixelAtAnchor), virtualStartDate, scale);

        // Get the exact offset of that date's LEFT EDGE
        const exactGridOffset = getPixelOffsetFromStart(currentDate, virtualStartDate, scale);

        console.log("SAVE: Scroll state", {
            scrollLeft,
            anchorOffset,
            sidebarWidth,
            gridPixelAtAnchor,
            detectedDate: currentDate.toDateString(),
            detectedDateISO: currentDate.toISOString(),
            exactGridOffset,
            scale,
            virtualStartDate: virtualStartDate.toDateString()
        });

        updateViewState({
            date: currentDate.toISOString(),
            gridOffset: exactGridOffset,
            scale: scale,
            timestamp: Date.now()
        });

    }, [scrollContainerRef, virtualStartDate, scale, updateViewState, anchorOffset, sidebarWidth]);

    // 2. Attach Listener
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        let timeout;
        const onScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(handleScroll, 100);
        };
        const onInteract = () => { userInteracted.current = true; };

        el.addEventListener('scroll', onScroll);
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

    // 3. Re-Align on Scale Change
    useEffect(() => {
        const oldScale = prevScale.current;
        const hasScaleChanged = oldScale !== scale;

        if (hasScaleChanged && isRestored && scrollContainerRef.current && virtualStartDate && viewState?.date) {
            // Use the saved date from viewState as the anchor (avoids race conditions with scroll animations)
            const dateAtAnchor = new Date(viewState.date);

            // Recalculate that date's position at the NEW scale and reposition it at the anchor
            const newGridOffset = getPixelOffsetFromStart(dateAtAnchor, virtualStartDate, scale);
            const newScrollLeft = Math.max(0, newGridOffset + sidebarWidth - anchorOffset);

            scrollContainerRef.current.scrollLeft = newScrollLeft;

            console.log('Scale changed:', {
                oldScale,
                newScale: scale,
                dateAtAnchor: dateAtAnchor.toDateString(),
                newScrollLeft
            });
        }

        // Update ref AFTER calculations
        prevScale.current = scale;
    }, [scale, isRestored, virtualStartDate, viewState, anchorOffset, sidebarWidth]);


    // 4. Restore State
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el || !virtualStartDate || initialRestoreDone.current) return;

        initialRestoreDone.current = true;

        if (viewState && viewState.date) {
            const { date, scale: savedScale } = viewState;
            if (savedScale && setSyncedScale) setSyncedScale(savedScale);

            const targetDate = new Date(date);
            // Always recalculate at CURRENT scale, don't use savedGridOffset
            // savedGridOffset was calculated at savedScale, which might be different
            const gridOffset = getPixelOffsetFromStart(targetDate, virtualStartDate, scale);

            // ALIGNMENT INTENT: Position so the LEFT EDGE of the target day column aligns with the Red Arrow
            const finalScroll = Math.max(0, gridOffset + sidebarWidth - anchorOffset);

            console.log("RESTORE: Restoring scroll", {
                savedDate: new Date(date).toDateString(),
                savedScale,
                currentScale: scale,
                gridOffset,
                sidebarWidth,
                anchorOffset,
                finalScroll,
                virtualStartDate: virtualStartDate.toDateString()
            });

            el.scrollLeft = finalScroll;

        } else {
            console.log("RESTORE: No saved state, using Today");
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const gridOffset = getPixelOffsetFromStart(today, virtualStartDate, scale);
            const finalScroll = Math.max(0, gridOffset + sidebarWidth - anchorOffset);

            el.scrollLeft = finalScroll;
        }

        setIsRestored(true);

    }, [virtualStartDate, scale, viewState, anchorOffset, sidebarWidth]);

    return { isRestored, syncedScale, setInteracted };
};
