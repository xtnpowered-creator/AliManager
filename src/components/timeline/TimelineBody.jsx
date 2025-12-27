import React from 'react';
import TimelineRow from '../TimelineRow'; // Implied needing parent dir import, check path

/**
 * TimelineBody Component
 * 
 * Renders the scrollable body of the timeline, containing one row per colleague.
 * Implements performance optimizations for large datasets via content-visibility.
 * 
 * Layout Strategy:
 * - First row (index 0): Current user's row, sticky below header (z-150)
 * - Remaining rows: Standard colleagues, use CSS content-visibility for lazy rendering
 * 
 * Performance Features:
 * - content-visibility: 'auto' on non-sticky rows
 *   - Browser only renders rows that are in/near viewport
 *   - Reduces CPU/memory for large team sizes (100+ colleagues)
 * - containIntrinsicSize: Prevents scrollbar jumps by reserving estimated row height
 * 
 * @param {Object} props
 * @param {Array<Object>} props.colleagues - Array of colleague objects
 * @param {Array<Date>} props.days - Array of dates to render
 * @param {Function} props.getColumnWidth - Returns pixel width for a given date
 * @param {Function} props.isToday - Returns true if date is today
 * @param {Function} props.isWeekend - Returns true if date is Saturday/Sunday
 * @param {Function} props.getTasksForColleague - Returns filtered task array for a colleague ID
 * @param {Function} props.onUpdateTask - Handler for task updates (drag, status change, etc.)
 * @param {Function} props.onTaskClick - Handler for single-click on task
 * @param {Function} props.onTaskDoubleClick - Handler for double-click on task
 * @param {Function} props.onContextMenu - Handler for right-click menu
 * @param {number} props.scale - Pixels per weekday column
 * @param {string} props.expandedTaskId - ID of currently expanded task (shows details)
 * @param {Array<string>} props.selectedTaskIds - Array of selected task IDs
 * @param {boolean} props.showSidebar - Whether to display colleague info sidebar
 * @param {Object} props.delegationMap - Map of delegated tasks
 * @param {Function} props.handleRevokeDelegation - Handler to revoke delegation
 * @param {Function} props.onDelegateConfig - Handler to configure delegation
 * @param {Object} props.user - Current user object (for permissions)
 * @param {Date} props.virtualStartDate - Reference date for absolute positioning of tasks
 */
const TimelineBody = ({
    colleagues,
    days,
    getColumnWidth,
    isToday,
    isWeekend,
    getTasksForColleague,
    onUpdateTask,
    onTaskClick,
    onTaskDoubleClick,
    onContextMenu,
    scale,
    expandedTaskId,
    selectedTaskIds,
    showSidebar,
    delegationMap,
    handleRevokeDelegation,
    onDelegateConfig = () => { },
    user, // Needed for permissions in row?
    virtualStartDate // NEW: Required for absolute positioning of tasks
}) => {
    return (
        <div className="flex flex-col min-w-max">
            {colleagues.map((colleague, cIdx) => (
                <div
                    key={colleague.id}
                    id={`timeline-row-${colleague.id}`}
                    // First row (current user): Sticky below header with strong visual separation
                    // Other rows: Standard flow with estimated height for scroll stability
                    className={cIdx === 0
                        ? "sticky top-[73px] z-[150] shadow-xl border-y-2 border-slate-900 bg-white"
                        : `border-t border-slate-300 ${cIdx === colleagues.length - 1 ? 'border-b' : ''}`}
                    style={cIdx === 0 ? {} : {
                        // Performance optimization: Only render rows near viewport
                        contentVisibility: 'auto',
                        // Reserve space to prevent scrollbar jump when row becomes visible
                        containIntrinsicSize: '0 150px' // Estimate average row height to prevent scrollbar jump
                    }}
                >
                    <TimelineRow
                        colleague={colleague}
                        colleagues={colleagues}
                        colleagueIndex={cIdx}
                        days={days}
                        getColumnWidth={getColumnWidth}
                        isToday={isToday}
                        isWeekend={isWeekend}
                        getTasksForColleague={getTasksForColleague}
                        onUpdate={onUpdateTask}
                        onTaskClick={onTaskClick}
                        onTaskDoubleClick={onTaskDoubleClick}
                        onTaskContextMenu={(e, t) => onContextMenu(e, 'task', t)}
                        onGridContextMenu={(d, c, e) => onContextMenu(e, 'grid', { date: d, colleagueId: c })}
                        safeDate={(d) => d ? new Date(d) : null}
                        scale={scale}
                        expandedTaskId={expandedTaskId}
                        selectedTaskIds={selectedTaskIds}
                        showColleagueInfo={showSidebar}
                        virtualStartDate={virtualStartDate}
                    />
                </div>
            ))}
        </div>
    );
};

export default TimelineBody;
