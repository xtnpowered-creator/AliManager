/**
 * Sorts tasks for display consistent with Timeline logic.
 * Order:
 * 1. Completed Tasks (Done) - seemingly first? (Logic says return -1 if a is done)
 *    - Sorted by CompletedAt (oldest first?)
 * 2. Active Tasks
 *    - Priority Score (1 > 2/High > 3/Med > 4/Low)
 *    - CreatedAt (Oldest first)
 * 
 * @param {Array} tasks 
 * @returns {Array} sorted tasks
 */
export const sortTasksForDisplay = (tasks) => {
    return [...tasks].sort((a, b) => {
        // 1. Status: Done tasks first? (Based on TimelineDayCell logic)
        // Logic in TimelineDayCell: if (a.status === 'done') return -1;
        // This puts 'done' items at index 0.
        // Wait, normally timelines show done items differently. 
        // In TimelineDayCell, it puts 'done' items in a separate loop anyway.
        // But for DetailedView, we want a linear list.
        // User said: "Single source of truth". I will replicate exact logic.

        const isDoneA = a.status === 'done';
        const isDoneB = b.status === 'done';

        if (isDoneA && isDoneB) {
            return new Date(a.completedAt || a.updatedAt || 0).getTime() - new Date(b.completedAt || b.updatedAt || 0).getTime();
        }
        if (isDoneA) return -1;
        if (isDoneB) return 1;

        // 2. Priority Score
        const getScore = (task) => {
            const p = String(task.priority || '').toLowerCase();
            return (p === '1') ? 0 : (p === '2' || p === 'high') ? 10 : (p === '3' || p === 'medium') ? 20 : 100;
        };
        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }

        // 3. CreatedAt (Tie-breaker)
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
};
