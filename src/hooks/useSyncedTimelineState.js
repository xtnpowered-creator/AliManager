import { useState, useEffect, useCallback, useRef } from 'react';
import { useTimelineViewContext } from '../context/TimelineViewContext';
import { getPixelOffsetFromStart, getDateFromPixelOffset } from '../utils/timelineMath';

/**
 * useSyncedTimelineState Hook
 * 
 * Manages scroll position persistence and scale synchronization for timeline views.
 * Saves/restores scroll state via TimelineViewContext (persisted to localStorage).
 * 
 * Core Functionality:
 * 1. **State Persistence**: Saves current visible date + scale when user scrolls
 * 2. **State Restoration**: Restores saved position on mount/navigation
 * 3. **Scale Synchronization**: Maintains focal point when zoom changes
 * 
 * Alignment Strategy:
 * - Uses "Red Arrow" anchor point (default: 350px from left viewport edge)
 * - Saves/restores which date's LEFT EDGE is aligned with the anchor
 * - On scale change: Keeps same date at anchor (no drift)
 * 
 * Formula Breakdown (Save):
 * ```
 * gridPixelAtAnchor = scrollLeft + anchorOffset - sidebarWidth
 * detectedDate = getDateFromPixelOffset(gridPixelAtAnchor, virtualStartDate, scale)
 * ```
 * 
 * Formula Breakdown (Restore):
 * ```
 * gridOffset = getPixelOffsetFromStart(savedDate, virtualStartDate, currentScale)
 * scrollLeft = gridOffset + sidebarWidth - anchorOffset
 * ```
 * 
 * User Interaction Detection:
 * - Only saves state after user interaction (prevents auto-scroll feedback loops)
 * - Tracks: pointerdown, wheel, keydown, touchstart
 * - Resets on component mount
 * 
 * Scale Change Behavior:
 * - Detects scale changes via useEffect comparing prevScale ref
 * - Recalculates saved date's position at new scale
 * - Repositions scroll to keep date at anchor (smooth zoom)
 * 
 * Precision Note:
 * - Math.round() on gridPixelAtAnchor prevents off-by-one errors
 * - Critical for consistent date detection across scale changes
 * 
 * @param {React.RefObject} scrollContainerRef - Scrollable container element
 * @param {Date} virtualStartDate - Reference date for pixel calculations
 * @param {number} scale - Current pixels per weekday
 * @param {number} [viewOffset=0] - Additional offset (legacy, unused)
 * @param {number} [anchorOffset=350] - Horizontal anchor position from left edge
 * @param {number} [sidebarWidth=0] - Width of left sidebar (200px Timeline, 0px Dashboard)
 * @returns {Object} State restoration status and interaction tracker
 */
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

    /**
     * 1. Save State Logic
     * Triggered on scroll (debounced 100ms), only after user interaction
     */
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || !updateViewState || !virtualStartDate) return;
        if (!userInteracted.current) return; // Prevent auto-scroll loops

        const scrollLeft = scrollContainerRef.current.scrollLeft;

        // Calculate which date's LEFT EDGE is at the anchor point
        // CRITICAL FIX: Round to nearest pixel to avoid off-by-one errors
        const gridPixelAtAnchor = Math.round(scrollLeft + anchorOffset - sidebarWidth);

        // Get the date that contains this pixel
        const currentDate = getDateFromPixelOffset(Math.max(0, gridPixelAtAnchor), virtualStartDate, scale);

        // Get the exact offset of that date's LEFT EDGE (for precision)
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

        // Persist to context (which saves to localStorage)
        updateViewState({
            date: currentDate.toISOString(),
            gridOffset: exactGridOffset,
            scale: scale,
            timestamp: Date.now()
        });

    }, [scrollContainerRef, virtualStartDate, scale, updateViewState, anchorOffset, sidebarWidth]);

    /**
     * 2. Attach Scroll Listener
     * Debounces save to avoid excessive writes
     * Tracks user interaction events
     */
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        let timeout;
        const onScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(handleScroll, 100); // 100ms debounce
        };
        const onInteract = () => { userInteracted.current = true; };

        // Listen for scroll and interaction events
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

    /**
     * 3. Re-Align on Scale Change
     * Keeps focal date at anchor when zoom level changes
     * Prevents drift during scale adjustments
     */
    useEffect(() => {
        const oldScale = prevScale.current;
        const hasScaleChanged = oldScale !== scale;

        if (hasScaleChanged && isRestored && scrollContainerRef.current && virtualStartDate && viewState?.date) {
            // Use the saved date from viewState as the anchor (avoids race conditions)
            const dateAtAnchor = new Date(viewState.date);

            // Recalculate that date's position at the NEW scale
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


    /**
     * 4. Restore State on Mount
     * Runs once on component mount to restore saved scroll position
     * Falls back to "Today" if no saved state exists
     */
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el || !virtualStartDate || initialRestoreDone.current) return;

        initialRestoreDone.current = true;

        if (viewState && viewState.date) {
            const { date, scale: savedScale } = viewState;
            if (savedScale && setSyncedScale) setSyncedScale(savedScale);

            const targetDate = new Date(date);
            // Always recalculate at CURRENT scale (savedGridOffset is from old scale)
            const gridOffset = getPixelOffsetFromStart(targetDate, virtualStartDate, scale);

            // ALIGNMENT INTENT: Position LEFT EDGE of target day at anchor
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
            // No saved state: Default to Today
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
