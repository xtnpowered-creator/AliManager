import { useCallback, useEffect } from 'react';
import { TIMELINE_LAYOUT } from '../config/layoutConstants';

export const useTimelineScroll = ({
    scrollContainerRef,
    days,
    getColumnWidth,
    viewOffset = 0,
    setInteracted,
    controlsRef,
    horiScrollAnchorX
}) => {

    const scrollToTarget = useCallback((date, colleagueId, smooth = true) => {
        if (!scrollContainerRef.current) return;
        if (setInteracted) setInteracted();

        // 1. Calculate Left (Date)
        let finalLeft = undefined;
        if (date) {
            const targetTime = new Date(date).setHours(0, 0, 0, 0);
            let offset = 0;

            // Handle out of bounds
            const startDay = days[0].getTime();
            const endDay = days[days.length - 1].getTime();

            if (targetTime < startDay) offset = 0;
            else if (targetTime > endDay) offset = days.reduce((acc, d) => acc + getColumnWidth(d), 0);
            else {
                for (const day of days) {
                    if (day.getTime() === targetTime) break;
                    offset += getColumnWidth(day);
                }
            }
            // Use Dynamic Anchor or Fallback
            const anchor = horiScrollAnchorX || TIMELINE_LAYOUT.SCROLL_ANCHOR_X;
            finalLeft = Math.max(0, offset + viewOffset - anchor);
        }

        // 2. Calculate Top (Colleague)
        let finalTop = undefined;
        if (colleagueId) {
            const row = document.getElementById(`timeline-row-${colleagueId}`);
            if (row) {
                finalTop = Math.max(0, row.offsetTop - TIMELINE_LAYOUT.SCROLL_ANCHOR_Y);
            }
        }

        // 3. Execute Unified Scroll
        const scrollOptions = {
            ...(finalLeft !== undefined && { left: finalLeft }),
            ...(finalTop !== undefined && { top: finalTop }),
            behavior: smooth ? 'smooth' : 'auto'
        };

        scrollContainerRef.current.scrollTo(scrollOptions);
    }, [scrollContainerRef, days, getColumnWidth, viewOffset, setInteracted, horiScrollAnchorX]);

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
