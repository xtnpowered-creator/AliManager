import React from 'react';
import TaskCard from '../TaskCard';
import { sortTasksForDisplay } from '../../utils/taskUtils';

const TimelineDayCell = ({
    day,
    colleagueId,
    getTasksForColleague,
    colWidth,
    isToday,
    isWeekend,
    onGridContextMenu,
    onTaskClick,
    onTaskDoubleClick,
    onTaskContextMenu,
    expandedTaskId,
    selectedTaskIds,
    scale,
    safeDate
}) => {
    // 1. Filter & Sort Tasks for this Day
    const dayDate = new Date(day);
    dayDate.setHours(0, 0, 0, 0);

    const rawTasks = getTasksForColleague(colleagueId).filter(t => {
        const isDone = t.status === 'done';
        if (isDone && t.completedAt) {
            const cDate = new Date(t.completedAt);
            cDate.setHours(0, 0, 0, 0);
            return cDate.getTime() === dayDate.getTime();
        }
        const d = safeDate(t.dueDate);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() === dayDate.getTime();
    });

    const dailyTasks = sortTasksForDisplay(rawTasks);

    const doneTasks = dailyTasks.filter(t => t.status === 'done');
    const activeTasks = dailyTasks.filter(t => t.status !== 'done');

    // 2. Layout Logic (Squeeze & Stack)
    const doneColumns = Math.ceil(doneTasks.length / 6);
    const activeColumns = activeTasks.length;
    const totalItems = doneColumns + activeColumns;
    const availableWidth = colWidth - 4;
    const itemWidth = 25;

    let k = 25;
    if (totalItems > 1) {
        const maxK = (availableWidth - itemWidth) / (totalItems - 1);
        k = Math.min(25, Math.max(3, maxK));
    }
    const squeeze = Math.max(0, 25 - k);
    const DONE_SEGMENT_PADDING = 5;
    const containerShift = (doneColumns > 0 && activeColumns > 0) ? squeeze + DONE_SEGMENT_PADDING : 0;

    return (
        <div
            style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth, boxSizing: 'border-box' }}
            className={`flex-none h-full border-r border-slate-300/70 flex items-center justify-center relative last:border-0 group/day ${isToday(day) ? 'bg-teal-100/40' : isWeekend(day) ? 'bg-slate-200/40' : ''}`}
            onContextMenu={(e) => onGridContextMenu && onGridContextMenu(day, colleagueId, e)}
        >
            {/* Visual Guides */}
            {day.getDate() === 1 && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500/30 z-10 pointer-events-none" />
            )}
            {/* Center Line visual */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-8 z-0 rounded-full transition-all duration-300 ${isToday(day) ? 'bg-teal-600/70 h-10' : 'bg-slate-400/70'}`} />

            {/* Task Layer REMOVED - Managed by TaskColumn via Virtualization */}
            <div className="absolute inset-0 hover:bg-black/5 rounded-none cursor-pointer -z-10" />
        </div>
    );
};

export default React.memo(TimelineDayCell);
