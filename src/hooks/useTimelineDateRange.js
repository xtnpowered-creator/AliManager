import { useMemo } from 'react';

/**
 * useTimelineDateRange Hook
 * 
 * Generates a fixed 90-day date range for the timeline view.
 * Range spans T-30 (30 days ago) to T+60 (60 days future).
 * 
 * Design Decision:
 * - Static range (calculated once, never changes during component lifecycle)
 * - Empty dependency array ensures dates remain stable across re-renders
 * - Prevents virtualization jank from shifting date references
 * 
 * Date Characteristics:
 * - All dates normalized to midnight (00:00:00.000)
 * - Prevents time-of-day comparison issues
 * - Sequential array: dates[0] = oldest, dates[89] = newest
 * 
 * @returns {Array<Date>} Array of 90 Date objects, normalized to midnight
 */
export const useTimelineDateRange = () => {
    return useMemo(() => {
        const result = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0); // Normalize to midnight
        start.setDate(start.getDate() - 30); // Start 30 days ago (T-30)

        // Generate 90 days total (T-30 to T+60)
        for (let i = 0; i < 90; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            result.push(d);
        }
        return result;
    }, []); // Empty deps = calculated once, frozen for component lifetime
};
