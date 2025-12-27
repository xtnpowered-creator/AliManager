/**
 * Sorts tasks for display consistent with Timeline rendering.
 * 
 * Sort order:
 * 1. Done tasks first (by completion date, oldest first)
 * 2. Active tasks by priority (1 > high > medium > low)
 * 3. Tie-breaker: creation date (oldest first)
 * 
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted tasks
 */
export const sortTasksForDisplay = (tasks) => {
    return [...tasks].sort((a, b) => {
        const isDoneA = a.status === 'done';
        const isDoneB = b.status === 'done';

        if (isDoneA && isDoneB) {
            return new Date(a.completedAt || a.updatedAt || 0).getTime() - new Date(b.completedAt || b.updatedAt || 0).getTime();
        }
        if (isDoneA) return -1;
        if (isDoneB) return 1;

        // Priority scoring: 1 (highest) > high > medium > low
        const getScore = (task) => {
            const p = String(task.priority || '').toLowerCase();
            return (p === '1') ? 0 : (p === '2' || p === 'high') ? 10 : (p === '3' || p === 'medium') ? 20 : 100;
        };
        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }

        // Tie-breaker: earliest created first
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
};
