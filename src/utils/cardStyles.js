export const getTaskCardColor = (task) => {
    // 0. Safe Date Normalization (Local Midnight Comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse Due Date: Handle ISO strings by creating Date and resetting to Local Midnight
    // This avoids UTC-based "Yesterday" shifts.
    let dueDate = null;
    if (task.dueDate) {
        const d = new Date(task.dueDate);
        // If invalid date, keep null
        if (!isNaN(d.getTime())) {
            dueDate = d;
            dueDate.setHours(0, 0, 0, 0);
        }
    }

    const isCompleted = task.status === 'done' || task.status === 'completed';
    // Determine Type: Project (The Container), Project Task (Child), or Lone Task
    const type = task.type === 'project' ? 'PROJ' : (task.projectId ? 'PTASK' : 'LTASK');
    const isStrong = type === 'PROJ'; // Projects get stronger colors

    // 1. Completed Tasks (Gray Bubbles)
    if (isCompleted) {
        if (type === 'PROJ') return 'bg-slate-400'; // Darker gray for Project completion
        if (type === 'LTASK') return 'bg-blue-200'; // Lone tasks stay blueish? (User said "project task marked Done")
        // "I'm not concerned with them [Lone Tasks]" -> Keep existing behavior
        return 'bg-slate-200'; // Project Tasks -> Gray
    }

    // 2. Lone Tasks (Active) -> Blue
    if (type === 'LTASK') {
        return 'bg-blue-400';
    }

    // 3. Project Tasks / Projects (Active) -> Color by Proximity
    if (!dueDate) {
        return 'bg-purple-200'; // No deadline
    }

    // Calculate Days Left
    // diffTime positive = Future, negative = Past
    const diffTime = dueDate.getTime() - today.getTime();
    const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Use Floor for full day buckets? 
    // Example: Due Today (0 diff) -> 0. Due Tmrrw (24h) -> 1.
    // If Overdue: -1, -2...

    // 4. Overdue (Past) -> Red
    if (daysLeft < 0) {
        return 'bg-red-500';
    }

    // 5. Future Ranges (User Specified)
    // Days 0, 1 & 2 -> Orange
    if (daysLeft <= 2) {
        return isStrong ? 'bg-orange-700' : 'bg-orange-400';
    }

    // Days 3, 4 & 5 -> Amber
    if (daysLeft <= 5) {
        return isStrong ? 'bg-amber-600' : 'bg-amber-400';
    }

    // Days 6, 7 & 8 -> Yellow
    if (daysLeft <= 8) {
        return isStrong ? 'bg-yellow-400' : 'bg-yellow-200';
    }

    // Days 9 and above -> Green
    return isStrong ? 'bg-emerald-500' : 'bg-emerald-200';
};
