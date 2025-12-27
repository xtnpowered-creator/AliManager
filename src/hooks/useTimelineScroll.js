import { useCallback, useEffect } from 'react';
import { TIMELINE_LAYOUT } from '../config/layoutConstants';
import { getPixelOffsetFromStart } from '../utils/timelineMath';

/**
 * useTimelineScroll Hook
 * 
 * Manages programmatic scrolling in the timeline view. Provides methods to scroll
 * to specific dates (horizontal) and colleagues (vertical).
 * 
 * Scroll Alignment Strategy:
 * - Horizontal (Date): Aligns the LEFT EDGE of the target day column with the Red Arrow anchor
 * - Vertical (Colleague): Positions the row a fixed distance from the top (SCROLL_ANCHOR_Y)
 * 
 * Formula Breakdown (Horizontal):
 * ```
 * scrollLeft = offset + sidebarWidth - anchor
 * ```
 * Where:
 * - offset: Pixel position of day column from virtualStartDate (via timelineMath)
 * - sidebarWidth: Width of colleague sidebar (200px on Timeline, 0px on Dashboard)
 * - anchor: Horizontal position of Red Arrow from viewport's left edge
 * 
 * Performance Note:
 * - Always uses `behavior: 'auto'` (instant scroll) instead of smooth animation
 * - Prevents jank on long-distance scrolls (e.g., jumping 6 months)
 * 
 * @param {Object} params
 * @param {React.RefObject} params.scrollContainerRef - Ref to scrollable container element
 * @param {Date} params.virtualStartDate - Reference date for pixel offset calculations
 * @param {number} params.scale - Pixels per weekday column
 * @param {Function} params.getColumnWidth - Returns width for a given date (accounts for weekends)
 * @param {number} [params.viewOffset=0] - Additional offset adjustment (legacy, unused)
 * @param {Function} [params.setInteracted] - Callback to mark user interaction (prevents auto-scroll)
 * @param {React.RefObject} [params.controlsRef] - Ref to expose scroll methods to parent
 * @param {number} [params.horiScrollAnchorX] - Dynamic anchor position (overrides constant)
 * @param {number} [params.sidebarWidth=0] - Width of left sidebar (0 for Dashboard, 200 for Timeline)
 * 
 * @returns {Object} Scroll control methods
 * @returns {Function} scrollToDate - Scrolls to a specific date (horizontally)
 * @returns {Function} scrollToColleague - Scrolls to a specific colleague row (vertically)
 * @returns {Function} scrollToTarget - Scrolls to both date and colleague simultaneously
 */
export const useTimelineScroll = ({
    scrollContainerRef,
    virtualStartDate,
    scale,
    getColumnWidth,
    viewOffset = 0,
    setInteracted,
    controlsRef,
    horiScrollAnchorX,
    sidebarWidth = 0
}) => {

    const scrollToTarget = useCallback((date, colleagueId, smooth = true) => {
        if (!scrollContainerRef.current) return;

        // Mark as user-initiated scroll (prevents auto-scroll conflicts)
        if (setInteracted) setInteracted();

        // 1. Calculate Horizontal Scroll (Date)
        let finalLeft = undefined;
        if (date && virtualStartDate) {
            // Get pixel offset of target date from virtual start
            const offset = getPixelOffsetFromStart(date, virtualStartDate, scale || 96);

            // Use dynamic anchor or fall back to layout constant
            const anchor = horiScrollAnchorX || TIMELINE_LAYOUT.SCROLL_ANCHOR_X;

            // Alignment Intent: Position LEFT EDGE of day column at Red Arrow
            // Formula: scrollLeft = offset + sidebarWidth - anchor
            finalLeft = Math.max(0, offset + sidebarWidth - anchor);
            console.log('Scrolling to:', { date, offset, sidebarWidth, anchor, finalLeft, scale });
        }

        // 2. Calculate Vertical Scroll (Colleague)
        let finalTop = undefined;
        if (colleagueId) {
            // Find colleague row in DOM by ID
            const row = document.getElementById(`timeline-row-${colleagueId}`);
            if (row) {
                // Position row at fixed distance from top
                finalTop = Math.max(0, row.offsetTop - TIMELINE_LAYOUT.SCROLL_ANCHOR_Y);
            }
        }

        // 3. Execute Instant Scroll (no animation to prevent jank)
        const scrollOptions = {
            ...(finalLeft !== undefined && { left: finalLeft }),
            ...(finalTop !== undefined && { top: finalTop }),
            behavior: 'auto' // Always instant for programmatic scrolls
        };

        scrollContainerRef.current.scrollTo(scrollOptions);
    }, [scrollContainerRef, virtualStartDate, scale, viewOffset, setInteracted, horiScrollAnchorX, sidebarWidth]);

    // Convenience wrappers for single-axis scrolling
    const scrollToDate = useCallback((date, smooth = true) => scrollToTarget(date, null, smooth), [scrollToTarget]);
    const scrollToColleague = useCallback((colleagueId, smooth = true) => scrollToTarget(null, colleagueId, smooth), [scrollToTarget]);

    // Attach scroll methods to controlsRef for external access (e.g., from parent component)
    useEffect(() => {
        if (controlsRef && controlsRef.current) {
            controlsRef.current.scrollToDate = scrollToDate;
            controlsRef.current.scrollToColleague = scrollToColleague;
            controlsRef.current.scrollToTarget = scrollToTarget;
        }
    }, [controlsRef, scrollToDate, scrollToColleague, scrollToTarget]);

    return {
        scrollToDate,
        scrollToColleague,
        scrollToTarget
    };
};
