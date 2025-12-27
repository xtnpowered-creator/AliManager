export const getTaskCardColor = (task) => {
    // 0. Safe Date Normalization (Local Midnight Comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse Due Date: Handle ISO strings by creating Date and resetting to Local Midnight
    // This avoids UTC-based "Yesterday" shifts.
    let dueDate = null;
    if (task.dueDate) {
        const d = new Date(task.dueDate);
        if (!isNaN(d.getTime())) {
            dueDate = d;
            dueDate.setHours(0, 0, 0, 0);
        }
    }

    const isCompleted = task.status === 'done' || task.status === 'completed';
    const type = task.type === 'project' ? 'PROJ' : (task.projectId ? 'PTASK' : 'LTASK');
    const isStrong = type === 'PROJ';

    // 1. Completed Tasks (Gray Bubbles)
    if (isCompleted) {
        if (type === 'PROJ') return 'bg-slate-400';
        if (type === 'LTASK') return 'bg-purple-200';
        return 'bg-slate-200';
    }

    // Calculate Days Left
    let daysLeft = null;
    if (dueDate) {
        const diffTime = dueDate.getTime() - today.getTime();
        daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // 2. Overdue (Past) → Red
    if (daysLeft !== null && daysLeft < 0) {
        return 'bg-red-500';
    }

    // 3. Lone Tasks (Active, Not Overdue) → Purple
    if (type === 'LTASK') {
        return 'bg-purple-400';
    }

    // 4. Project Tasks / Projects (Active) → Color by Proximity
    if (!dueDate) {
        return 'bg-purple-200';
    }

    // 5. Future Ranges (User Specified)
    // Days 0, 1 & 2 → Orange
    if (daysLeft <= 2) {
        return isStrong ? 'bg-orange-700' : 'bg-orange-400';
    }

    // Days 3, 4 & 5 → Amber
    if (daysLeft <= 5) {
        return isStrong ? 'bg-amber-600' : 'bg-amber-400';
    }

    // Days 6, 7 & 8 → Yellow
    if (daysLeft <= 8) {
        return isStrong ? 'bg-yellow-400' : 'bg-yellow-200';
    }

    // Days 9 and above → Green
    return isStrong ? 'bg-emerald-500' : 'bg-emerald-200';
};
