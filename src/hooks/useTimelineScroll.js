import { useCallback, useEffect } from 'react';
import { TIMELINE_LAYOUT } from '../config/layoutConstants';
import { getPixelOffsetFromStart } from '../utils/timelineMath';

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
        if (setInteracted) setInteracted();

        // 1. Calculate Left (Date) via Math
        let finalLeft = undefined;
        if (date && virtualStartDate) {
            const offset = getPixelOffsetFromStart(date, virtualStartDate, scale || 96);

            // Use Dynamic Anchor or Fallback
            const anchor = horiScrollAnchorX || TIMELINE_LAYOUT.SCROLL_ANCHOR_X;

            // ALIGNMENT INTENT: Position so the LEFT EDGE of the target day column aligns with the Red Arrow
            // Formula: scrollLeft = offset + sidebarWidth - anchor
            // - offset: pixel position of the left edge of the day column (from virtualStartDate)
            // - sidebarWidth: width of the colleague sidebar (200px on Timelines, 0px on Dashboard)
            // - anchor: horizontal position of the Red Arrow from the left edge of the viewport
            finalLeft = Math.max(0, offset + sidebarWidth - anchor);
            console.log('Scrolling to:', { date, offset, sidebarWidth, anchor, finalLeft, scale });
        }

        // 2. Calculate Top (Colleague)
        let finalTop = undefined;
        if (colleagueId) {
            const row = document.getElementById(`timeline-row-${colleagueId}`);
            if (row) {
                finalTop = Math.max(0, row.offsetTop - TIMELINE_LAYOUT.SCROLL_ANCHOR_Y);
            }
        }

        // 3. Execute Instant Scroll (no animation - prevents jank on long distances)
        const scrollOptions = {
            ...(finalLeft !== undefined && { left: finalLeft }),
            ...(finalTop !== undefined && { top: finalTop }),
            behavior: 'auto' // Always instant for programmatic scrolls
        };

        scrollContainerRef.current.scrollTo(scrollOptions);
    }, [scrollContainerRef, virtualStartDate, scale, viewOffset, setInteracted, horiScrollAnchorX, sidebarWidth]);

    const scrollToDate = useCallback((date, smooth = true) => scrollToTarget(date, null, smooth), [scrollToTarget]);
    const scrollToColleague = useCallback((colleagueId, smooth = true) => scrollToTarget(null, colleagueId, smooth), [scrollToTarget]);

    // Attach to controlsRef
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
