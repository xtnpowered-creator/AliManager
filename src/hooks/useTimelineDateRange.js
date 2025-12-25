import { useMemo } from 'react';

export const useTimelineDateRange = () => {
    return useMemo(() => {
        const result = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 30); // Start 30 days ago

        // Generate 90 days total (approx T-30 to T+60)
        for (let i = 0; i < 90; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            result.push(d);
        }
        return result;
    }, []);
};
