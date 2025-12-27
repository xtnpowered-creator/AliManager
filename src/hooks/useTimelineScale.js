import { useState, useEffect, useCallback } from 'react';

/**
 * useTimelineScale Hook
 * 
 * Manages user-specific timeline zoom level (density) with localStorage persistence.
 * Each user has independent scale preferences.
 * 
 * Scale Definition:
 * - Measured in pixels per weekday column
 * - weekend columns render at 50% width (WEEKEND_RATIO in timelineMath.js)
 * - Display converted to "inches per day" (scale / 96) for UI
 * - Example: 120px = 1.25 inches/day, 192px = 2.00 inches/day
 * 
 * Range Limits:
 * - MIN: 32px (0.33 inches) - Very dense, shows many weeks
 * - MAX: 480px (5.00 inches) - Very spacious, shows few days
 * - DEFAULT: 120px (1.25 inches) - Balanced view
 * 
 * Persistence Strategy:
 * - Key: `timeline_scale_pref_${userId}` (user-specific)
 * - Multi-user support: Each account remembers own zoom
 * - Migration: Old "days visible" format auto-discarded if < MIN_SCALE
 * - Robust validation: Clamping, NaN checks, try/catch
 * 
 * State Lifecycle:
 * 1. **Initialization**: Read from localStorage, fallback to DEFAULT
 * 2. **User Change**: Reload scale when user.uid changes
 * 3. **Update**: setScale clamps, rounds, and persists
 * 
 * Why User-Specific?
 * - Admin may want dense view (see many days)
 * - Regular user may prefer spacious view (focus on fewer tasks)
 * - Shared computers don't affect each other's preferences
 * 
 * Usage:
 * ```jsx
 * const { scale, setScale, scaleInInches } = useTimelineScale(user);
 * // scale: 120 (pixels per weekday)
 * // scaleInInches: "1.25" (formatted for display)
 * // setScale(200) → saves and applies new zoom
 * ```
 * 
 * @param {Object} user - Current user object (needs uid property)
 * @returns {Object} { scale, setScale, scaleInInches, MIN_SCALE, MAX_SCALE, DEFAULT_SCALE }
 */

// Constants (based on 96px = 1 inch CSS standard)
const DEFAULT_SCALE = 120; // 1.25 inches
const MIN_SCALE = 32;      // 0.33 inches
const MAX_SCALE = 480;     // 5.00 inches

export const useTimelineScale = (user) => {
    const STORAGE_KEY = `timeline_scale_pref_${user?.uid || 'default'}`;

    // 1. Initialize State from LocalStorage or Default
    const [scale, setScaleState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = parseInt(saved, 10);
                // Robustness: If parsed is valid and reasonable, use it.
                // If it's the old "days" format (< 48), discard and use default.
                if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Failed to read timeline scale pref:", e);
        }
        return DEFAULT_SCALE;
    });

    // 2. Reload scale when user changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
                    setScaleState(parsed);
                    return;
                }
            }
            setScaleState(DEFAULT_SCALE);
        } catch (e) {
            console.warn("Failed to reload timeline scale pref:", e);
            setScaleState(DEFAULT_SCALE);
        }
    }, [user?.uid, STORAGE_KEY]);

    // 3. Safe Setter (Clamps value and persists)
    const setScale = useCallback((newValue) => {
        // Handle functional updates if passed (e.g. prev => prev + 10)
        setScaleState(prev => {
            const val = typeof newValue === 'function' ? newValue(prev) : newValue;

            // Clamp
            let clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, val));

            // Round to nearest integer to avoid sub-pixel gaps? 
            // 96 * 0.25 = 24. So integer is fine.
            clamped = Math.round(clamped);

            // Persist
            try {
                localStorage.setItem(STORAGE_KEY, clamped.toString());
            } catch (e) {
                console.warn("Failed to save timeline scale pref:", e);
            }

            return clamped;
        });
    }, [STORAGE_KEY]);

    // 3. Helper: Get Current Inch Value (for UI display)
    const scaleInInches = (scale / 96).toFixed(2);

    return {
        scale,
        setScale,
        scaleInInches,
        // Expose constants if UI needs limits
        MIN_SCALE,
        MAX_SCALE,
        DEFAULT_SCALE
    };
};
