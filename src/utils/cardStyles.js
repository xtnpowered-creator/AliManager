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

    // Priority helpers
    const isHigh = task.priority === 'high' || daysLeft < 7;
    const isMed = task.priority === 'medium' || (daysLeft >= 7 && daysLeft < 14);

    const isStrong = type === 'PROJ';

    if (isHigh) {
        return isStrong ? 'bg-orange-600' : 'bg-orange-300';
    }
    if (isMed) {
        return isStrong ? 'bg-amber-400' : 'bg-amber-200';
    }

    // Low priority (> 2 weeks)
    return isStrong ? 'bg-emerald-500' : 'bg-emerald-200';
};
