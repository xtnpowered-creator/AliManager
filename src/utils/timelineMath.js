/**
 * TIMELINE MATH UTILITIES
 * Single Source of Truth for all Date <-> Pixel calculations.
 * Supports variable column widths (Weekends = 50% width).
 */

const ONE_DAY_MS = 86400000;
const WEEKEND_RATIO = 0.5; // Configurable Ratio (0.5 = 50% width)

/**
 * Returns the width of a single day in pixels based on the current scale.
 * @param {Date} date - The date to check (for weekend logic).
 * @param {number} scale - Pixels per standard day.
 */
export const getDayWidth = (date, scale) => {
    const day = date.getDay();
    // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;
    return isWeekend ? scale * WEEKEND_RATIO : scale;
};

/**
 * Returns the total width of a 7-day week in pixels.
 * (5 Weekdays + 2 Weekends)
 * @param {number} scale 
 */
export const getWeekWidth = (scale) => {
    return (5 * scale) + (2 * scale * WEEKEND_RATIO);
};

/**
 * Calculates the precise pixel offset of a Target Date relative to a Start Date.
 * Handles extensive ranges by using "Full Weeks" math + "Remainder Days" math.
 * 
 * @param {Date} targetDate 
 * @param {Date} startDate 
 * @param {number} scale 
 */
export const getPixelOffsetFromStart = (targetDate, startDate, scale) => {
    // Normalize to Midnight
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const target = new Date(targetDate); target.setHours(0, 0, 0, 0);

    const diffMs = target - start;
    if (diffMs === 0) return 0;

    const diffDays = Math.round(diffMs / ONE_DAY_MS);
    const direction = diffDays < 0 ? -1 : 1;
    const absDays = Math.abs(diffDays);

    // 1. Calculate Full Weeks
    const fullWeeks = Math.floor(absDays / 7);
    const weekPixelWidth = getWeekWidth(scale);
    let totalPixels = fullWeeks * weekPixelWidth;

    // 2. Calculate Remainder Days
    const remainderDays = absDays % 7;

    if (direction === 1 && remainderDays > 0) {
        // Going FORWARD: walk from end of full weeks to target
        let walker = new Date(start);
        walker.setDate(walker.getDate() + (fullWeeks * 7));

        for (let i = 0; i < remainderDays; i++) {
            totalPixels += getDayWidth(walker, scale);
            walker.setDate(walker.getDate() + 1);
        }
    } else if (direction === -1 && remainderDays > 0) {
        // Going BACKWARD: use recursion for safety
        return -1 * getPixelOffsetFromStart(startDate, targetDate, scale);
    }

    return totalPixels;
};

/**
 * Calculates which Date corresponds to a specific pixel offset.
 * Used for determining which days to render based on Scroll Left.
 * 
 * @param {number} pixelOffset 
 * @param {Date} startDate 
 * @param {number} scale 
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
        // Tolerance: If we are within 1px, we are "there"
        if ((remainderPixels - currentPixel) < 1) break;

        const w = getDayWidth(result, scale);
        // Important: If this day pushes us OVER the target, we stop HERE.
        // i.e., The target pixel is INSIDE this day.
        if (currentPixel + w > remainderPixels) {
            break;
        }

        currentPixel += w;
        result.setDate(result.getDate() + 1);
    }

    return result;
};
