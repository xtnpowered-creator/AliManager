import React from 'react';
import TaskCard from '../TaskCard';
import { sortTasksForDisplay } from '../../utils/taskUtils';

/**
 * TimelineDayCell Component
 * 
 * Renders a single day cell within a colleague's timeline row.
 * Previously handled task rendering, but tasks are now managed by TaskColumn
 * via virtualized absolute positioning for better performance.
 * 
 * Current Responsibilities:
 * - Visual background styling (today highlight, weekend shading)
 * - Month boundary indicators (teal line on 1st of month)
 * - Center alignment guide (subtle vertical line)
 * - Context menu target for grid interactions (e.g., create task on right-click)
 * 
 * Layout Logic (Preserved but unused - legacy from pre-virtualization):
 * - Done tasks: Grouped into columns of 6 bubbles each
 * - Active tasks: One column per task
 * - Squeeze factor (k): Calculates overlap when tasks exceed available width
 *   - k=25 (default spacing), k=3 (maximum squeeze)
 *   - Done segment gets 5px padding when both done and active tasks exist
 * 
 * Note: Task rendering logic is commented out but preserved for reference.
 * All actual task rendering happens in TaskColumn.jsx using absolute positioning.
 * 
 * @param {Object} props
 * @param {Date} props.day - The date this cell represents
 * @param {string} props.colleagueId - ID of colleague who owns this row
 * @param {Function} props.getTasksForColleague - Returns tasks for the given colleague
 * @param {number} props.colWidth - Pixel width of this column
 * @param {Function} props.isToday - Returns true if date is today
 * @param {Function} props.isWeekend - Returns true if date is Saturday/Sunday
 * @param {Function} props.onGridContextMenu - Handler for right-click on empty grid space
 * @param {Function} props.onTaskClick - Handler for single-click on task
 * @param {Function} props.onTaskDoubleClick - Handler for double-click on task
 * @param {Function} props.onTaskContextMenu - Handler for right-click on task
 * @param {string} props.expandedTaskId - ID of currently expanded task
 * @param {Array<string>} props.selectedTaskIds - IDs of selected tasks
 * @param {number} props.scale - Pixels per weekday column
 * @param {Function} props.safeDate - Safely converts date strings to Date objects
 */
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
    // (Used to determine layout but no longer renders tasks directly)
    const dayDate = new Date(day);
    dayDate.setHours(0, 0, 0, 0);

    const rawTasks = getTasksForColleague(colleagueId).filter(t => {
        const isDone = t.status === 'done';
        // Done tasks: Match by completion date
        if (isDone && t.completedAt) {
            const cDate = new Date(t.completedAt);
            cDate.setHours(0, 0, 0, 0);
            return cDate.getTime() === dayDate.getTime();
        }
        // Active tasks: Match by due date
        const d = safeDate(t.dueDate);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() === dayDate.getTime();
    });

    const dailyTasks = sortTasksForDisplay(rawTasks);

    const doneTasks = dailyTasks.filter(t => t.status === 'done');
    const activeTasks = dailyTasks.filter(t => t.status !== 'done');

    // 2. Layout Logic (Squeeze & Stack)
    // Legacy calculation preserved for reference - not used for rendering
    const doneColumns = Math.ceil(doneTasks.length / 6);
    const activeColumns = activeTasks.length;
    const totalItems = doneColumns + activeColumns;
    const availableWidth = colWidth - 4;
    const itemWidth = 25;

    // Calculate spacing/squeeze factor
    let k = 25; // Default spacing in pixels
    if (totalItems > 1) {
        const maxK = (availableWidth - itemWidth) / (totalItems - 1);
        k = Math.min(25, Math.max(3, maxK)); // Clamp between 3px (max squeeze) and 25px (no squeeze)
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

            {/* Month Start Indicator (1st of month) */}
            {day.getDate() === 1 && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500/30 z-10 pointer-events-none" />
            )}

            {/* Center Line Visual - Subtle alignment guide */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-8 z-0 rounded-full transition-all duration-300 ${isToday(day) ? 'bg-teal-600/70 h-10' : 'bg-slate-400/70'}`} />

            {/* Task Layer REMOVED - Managed by TaskColumn via Virtualization */}

            {/* Hover State - Indicates interactable area */}
            <div className="absolute inset-0 hover:bg-black/5 rounded-none cursor-pointer -z-10" />
        </div>
    );
};

export default React.memo(TimelineDayCell);
