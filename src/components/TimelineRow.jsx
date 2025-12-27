import React from 'react';
import TimelineColleagueCell from './timeline/TimelineColleagueCell';
import TimelineDayCell from './timeline/TimelineDayCell';
import TaskColumn from './timeline/TaskColumn';

/**
 * TimelineRow Component
 * 
 * Renders a single horizontal row in the timeline representing one colleague's tasks.
 * Combines three layers: colleague info sidebar, day cell grid, and task overlay.
 * 
 * Architecture (3 Layers):
 * 
 * 1. Colleague Sidebar (Left, Optional):
 *    - Shows colleague's avatar, name, position, company, department
 *    - Sticky left positioning to remain visible during horizontal scroll
 *    - Only rendered when showColleagueInfo=true
 * 
 * 2. Day Cell Grid (Middle):
 *    - One cell per day in the timeline
 *    - Provides visual background (today highlight, weekend shading)
 *    - Handles context menu for grid interactions (e.g., create task)
 *    - See TimelineDayCell.jsx for cell-level details
 *    - Horizontal baseline (4px slate line) connects all days visually
 * 
 * 3. Task Overlay (Top, z-50):
 *    - Absolute positioned above day cells
 *    - Managed by TaskColumn component via virtualization
 *    - pointer-events-none on container, pointer-events-auto on individual tasks
 *    - This allows clicks to pass through to grid while tasks remain interactive
 * 
 * Performance:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Task rendering uses absolute positioning for large date ranges
 * 
 * Layout:
 * - Fixed height: 97px (accommodates 93px capsule + 4px padding)
 * - Hover effect: Subtle slate background on entire row
 * - Last row: No bottom border to avoid double-border with container
 * 
 * @param {Object} props
 * @param {Object} props.colleague - Colleague object (name, avatar, etc.)
 * @param {number} props.colleagueIndex - Index of this row in the overall list
 * @param {Array<Object>} props.colleagues - Full colleague list (for context)
 * @param {Array<Date>} props.days - Array of dates to render
 * @param {Function} props.getColumnWidth - Returns pixel width for a given date
 * @param {Function} props.isToday - Returns true if date is today
 * @param {Function} props.isWeekend - Returns true if date is Saturday/Sunday
 * @param {Function} props.getTasksForColleague - Returns filtered tasks for colleague ID
 * @param {Function} props.onUpdate - Handler for task updates
 * @param {number} props.scale - Pixels per weekday column
 * @param {Function} props.onTaskClick - Single-click handler
 * @param {Function} props.onTaskDoubleClick - Double-click handler
 * @param {Function} props.onTaskContextMenu - Right-click handler for tasks
 * @param {Function} props.onGridContextMenu - Right-click handler for grid cells
 * @param {Function} props.safeDate - Safely converts date strings to Date objects
 * @param {string} props.expandedTaskId - ID of currently expanded task
 * @param {Set<string>} [props.selectedTaskIds=new Set()] - Set of selected task IDs
 * @param {boolean} [props.showColleagueInfo=true] - Whether to show sidebar
 * @param {Date} props.virtualStartDate - Reference date for absolute positioning
 */
const TimelineRow = ({
    colleague,
    colleagueIndex,
    colleagues,
    days,
    getColumnWidth,
    isToday,
    isWeekend,
    getTasksForColleague,
    onUpdate,
    scale,
    onTaskClick,
    onTaskDoubleClick,
    onTaskContextMenu,
    onGridContextMenu,
    safeDate,
    expandedTaskId,
    selectedTaskIds = new Set(),
    showColleagueInfo = true,
    virtualStartDate
}) => {
    return (
        <div className={`flex border-b border-slate-200 group hover:bg-slate-50/30 transition-colors last:border-0 h-[97px] relative bg-white`}>

            {/* Layer 1: Colleague Sidebar (Sticky Left) */}
            {showColleagueInfo && (
                <TimelineColleagueCell colleague={colleague} />
            )}

            {/* Layers 2 & 3: Day Grid + Task Overlay */}
            <div className="flex relative shrink-0">

                {/* Horizontal baseline - Visual connection across all days */}
                <div className="absolute top-1/2 left-0 w-full h-[4px] bg-slate-400/50 -translate-y-1/2 z-0" />

                {/* Layer 2: Day Cell Grid */}
                {days.map((day, dIdx) => (
                    <TimelineDayCell
                        key={dIdx}
                        day={day}
                        colleagueId={colleague.id}
                        colWidth={getColumnWidth(day)}
                        getTasksForColleague={getTasksForColleague}
                        isToday={isToday}
                        isWeekend={isWeekend}
                        onGridContextMenu={onGridContextMenu}
                        onTaskClick={onTaskClick}
                        onTaskDoubleClick={onTaskDoubleClick}
                        onTaskContextMenu={onTaskContextMenu}
                        expandedTaskId={expandedTaskId}
                        selectedTaskIds={selectedTaskIds}
                        scale={scale}
                        safeDate={safeDate}
                    />
                ))}

                {/* Layer 3: Task Overlay (Absolute Positioned) */}
                {/* pointer-events-none allows clicks to pass through to grid */}
                {/* TaskColumn re-enables pointer-events on individual tasks */}
                <div className="absolute inset-0 pointer-events-none z-[50]">
                    <TaskColumn
                        tasks={getTasksForColleague(colleague.id)}
                        virtualStartDate={virtualStartDate}
                        scale={scale}
                        onUpdate={onUpdate}
                        onTaskClick={onTaskClick}
                        onTaskDoubleClick={onTaskDoubleClick}
                        onContextMenu={onTaskContextMenu}
                        expandedTaskId={expandedTaskId}
                        selectedTaskIds={selectedTaskIds}
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(TimelineRow);
