export const getTaskCardColor = (task) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    if (dueDate) dueDate.setHours(0, 0, 0, 0);

    const isCompleted = task.status === 'done' || task.status === 'completed';
    const type = task.type === 'project' ? 'PROJ' : (task.projectId ? 'PTASK' : 'LTASK');

    // 1. Overdue logic (> 1 week overdue)
    if (dueDate && today > dueDate && !isCompleted) {
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return 'bg-red-500';
        // If overdue but <= 7 days, still red
        return 'bg-red-500';
    }

    // 2. Unassigned or No Due Date
    if (!dueDate || !task.assignedTo?.length) {
        return 'bg-purple-200';
    }

    // 3. Completed
    if (isCompleted) {
        if (type === 'PROJ') return 'bg-slate-400';
        if (type === 'PTASK') return 'bg-slate-200';
        if (type === 'LTASK') return 'bg-blue-200';
        return 'bg-slate-200';
    }

    // 4. LTASK Active
    if (type === 'LTASK') {
        return 'bg-blue-400';
    }

    // 5. Active PROJ/PTASK (Priority & Time based)
    const timeDiff = dueDate - today;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Priority helpers (Date Logic Only - Explicit Priority does NOT affect color)
    const isStrong = type === 'PROJ';

    // New Splits: 3, 6, 9 days (High -> Med -> Low)

    // < 3 Days: High Urgency (Orange)
    if (daysLeft < 3) {
        return isStrong ? 'bg-orange-700' : 'bg-orange-400';
    }

    // 3 - 6 Days: Medium Urgency (Amber)
    if (daysLeft < 6) {
        return isStrong ? 'bg-amber-600' : 'bg-amber-400';
    }

    // 6 - 9 Days: Approaching (Yellow)
    if (daysLeft < 9) {
        return isStrong ? 'bg-yellow-400' : 'bg-yellow-200';
    }

    // > 9 Days: Safe (Green)
    return isStrong ? 'bg-emerald-500' : 'bg-emerald-200';
};
