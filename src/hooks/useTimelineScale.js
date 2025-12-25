import { useState, useEffect, useCallback } from 'react';

// Constants (based on 96px = 1 inch CSS standard)
const DEFAULT_SCALE = 120; // 1.25 inches
const MIN_SCALE = 32;      // 0.33 inches
const MAX_SCALE = 480;     // 5.00 inches
const STORAGE_KEY = 'timeline_scale_pref';

export const useTimelineScale = () => {
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

    // 2. Safe Setter (Clamps value and persists)
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
    }, []);

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
