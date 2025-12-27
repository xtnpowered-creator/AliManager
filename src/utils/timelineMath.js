/**
 * TIMELINE MATH UTILITIES
 * Single source of truth for all Date <-> Pixel calculations.
 * Supports variable column widths (weekends render at 50% width).
 */

const ONE_DAY_MS = 86400000;
const WEEKEND_RATIO = 0.5;

/**
 * Returns the width of a single day in pixels based on scale.
 * Weekends render at 50% of weekday width.
 * 
 * @param {Date} date - The date to check (for weekend logic)
 * @param {number} scale - Pixels per standard weekday
 * @returns {number} Width in pixels
 */
export const getDayWidth = (date, scale) => {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    return isWeekend ? scale * WEEKEND_RATIO : scale;
};

/**
 * Returns the total width of a 7-day week in pixels.
 * Accounts for compressed weekend rendering (5 weekdays + 2 half-width weekends).
 * 
 * @param {number} scale - Pixels per standard weekday
 * @returns {number} Total week width in pixels
 */
export const getWeekWidth = (scale) => {
    return (5 * scale) + (2 * scale * WEEKEND_RATIO);
};

/**
 * Calculates the pixel offset of a target date relative to a start date.
 * Handles extensive ranges efficiently using week-based math + remainder days.
 * 
 * @param {Date} targetDate - Destination date
 * @param {Date} startDate - Reference/origin date
 * @param {number} scale - Pixels per weekday
 * @returns {number} Pixel offset (negative if target is before start)
 */
export const getPixelOffsetFromStart = (targetDate, startDate, scale) => {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const target = new Date(targetDate); target.setHours(0, 0, 0, 0);

    const diffMs = target - start;
    if (diffMs === 0) return 0;

    const diffDays = Math.round(diffMs / ONE_DAY_MS);
    const direction = diffDays < 0 ? -1 : 1;
    const absDays = Math.abs(diffDays);

    // Calculate full weeks
    const fullWeeks = Math.floor(absDays / 7);
    const weekPixelWidth = getWeekWidth(scale);
    let totalPixels = fullWeeks * weekPixelWidth;

    // Add remainder days
    const remainderDays = absDays % 7;

    if (direction === 1 && remainderDays > 0) {
        let walker = new Date(start);
        walker.setDate(walker.getDate() + (fullWeeks * 7));

        for (let i = 0; i < remainderDays; i++) {
            totalPixels += getDayWidth(walker, scale);
            walker.setDate(walker.getDate() + 1);
        }
    } else if (direction === -1 && remainderDays > 0) {
        return -1 * getPixelOffsetFromStart(startDate, targetDate, scale);
    }

    return totalPixels;
};

/**
 * Calculates which date corresponds to a specific pixel offset.
 * Used for determining which days to render based on scroll position.
 * 
 * @param {number} pixelOffset - Pixel distance from start
 * @param {Date} startDate - Reference/origin date
 * @param {number} scale - Pixels per weekday
 * @returns {Date} Date at the specified pixel offset
 */
export const getDateFromPixelOffset = (pixelOffset, startDate, scale) => {
    if (pixelOffset === 0) return new Date(startDate);

    const weekWidth = getWeekWidth(scale);
    const fullWeeks = Math.floor(pixelOffset / weekWidth);
    const remainderPixels = pixelOffset % weekWidth;

    const result = new Date(startDate);
    result.setDate(result.getDate() + (fullWeeks * 7));

    // Walk forward through remainder pixels
    let currentPixel = 0;
    while (currentPixel < remainderPixels) {
        if ((remainderPixels - currentPixel) < 1) break;

        const w = getDayWidth(result, scale);

        // Stop if this day would push us past the target
        if (currentPixel + w > remainderPixels) {
            break;
        }

        currentPixel += w;
        result.setDate(result.getDate() + 1);
    }

    return result;
};
