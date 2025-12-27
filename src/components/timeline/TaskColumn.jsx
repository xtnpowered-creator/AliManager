import React, { useMemo } from 'react';
import { getPixelOffsetFromStart, getDayWidth } from '../../utils/timelineMath';
import TaskCard from '../TaskCard';
import { sortTasksForDisplay } from '../../utils/taskUtils';

/**
 * TaskColumn Component
 * 
 * Renders all tasks for a colleague row using absolute positioning.
 * This approach replaces the old per-cell rendering for better performance
 * with large datasets and long date ranges.
 * 
 * Architecture:
 * - Groups tasks by date (using completion date for done tasks, due date for active)
 * - Calculates absolute pixel positions using timelineMath utilities
 * - Renders tasks in date-based "columns" that overlay the grid via absolute positioning
 * 
 * Layout Algorithm (per date column):
 * 1. Separate done tasks from active tasks
 * 2. Done tasks: Group into columns of 6 bubbles each (stacked vertically)
 * 3. Active tasks: One column per task (capsule format, 93px tall)
 * 4. Calculate squeeze factor (k) when tasks exceed available width:
 *    - k=25: Default spacing (no squeeze)
 *    - k=3: Maximum squeeze (minimum safe overlap)
 *    - Formula: maxK = (availableWidth - itemWidth) / (totalItems - 1)
 * 5. Add 5px padding between done segment and active segment
 * 
 * Visual Variants:
 * - BUBBLE: Done tasks, circular 25x25px, can stack vertically 
 * - CAPSULE: Active tasks, 25x93px tall pills
 * 
 * Z-Index Management:
 * - Expanded task: z-2000 (always on top)
 * - Hovered task: z-3000 (even higher for interaction feedback)
 * - Default: z-0 to z-n (based on position in stack)
 * 
 * Vertical Stacking (Done Bubbles):
 * - When >3 bubbles in a column, calculate negative bottom margin to fit within 93px height
 * - negativeMarginSub: min(22, max(0, requiredOverlap))
 * - requiredOverlap = ((count * 25) - 93) / (count - 1)
 * 
 * @param {Object} props
 * @param {Array<Object>} props.tasks - All tasks for this colleague
 * @param {Date} props.virtualStartDate - Reference date for absolute positioning calculations
 * @param {number} props.scale - Pixels per weekday column
 * @param {Function} props.onUpdate - Handler for task updates (drag, edit, etc.)
 * @param {Function} props.onTaskClick - Single-click handler
 * @param {Function} props.onTaskDoubleClick - Double-click handler
 * @param {Function} props.onContextMenu - Right-click handler
 * @param {string} props.expandedTaskId - ID of currently expanded task
 * @param {Set<string>} props.selectedTaskIds - Set of selected task IDs
 */
const TaskColumn = ({
    tasks,
    virtualStartDate,
    scale,
    onUpdate,
    onTaskClick,
    onTaskDoubleClick,
    onContextMenu,
    expandedTaskId,
    selectedTaskIds
}) => {
    // 1. Group tasks by Date
    // Done tasks use completedAt, active tasks use dueDate
    const tasksByDate = useMemo(() => {
        const map = new Map();
        if (!tasks) return map;

        tasks.forEach(task => {
            const dateStr = task.status === 'done' && task.completedAt
                ? new Date(task.completedAt).toDateString()
                : task.dueDate ? new Date(task.dueDate).toDateString() : null;

            if (!dateStr) return;

            if (!map.has(dateStr)) map.set(dateStr, []);
            map.get(dateStr).push(task);
        });
        return map;
    }, [tasks]);

    if (!tasks || tasks.length === 0) return null;

    return (
        <div className="relative w-full h-full pointer-events-none">
            {Array.from(tasksByDate.entries()).map(([dateStr, dayTasks]) => {
                const dayDate = new Date(dateStr);
                // Calculate absolute pixel position for this date column
                const leftPos = getPixelOffsetFromStart(dayDate, virtualStartDate, scale || 96);
                const colWidth = getDayWidth(dayDate, scale || 96);

                // --- LAYOUT LOGIC (Same as TimelineDayCell) ---
                const sortedTasks = sortTasksForDisplay(dayTasks);
                const doneTasks = sortedTasks.filter(t => t.status === 'done');
                const activeTasks = sortedTasks.filter(t => t.status !== 'done');

                // Calculate column counts
                const doneColumns = Math.ceil(doneTasks.length / 6); // 6 bubbles per column
                const activeColumns = activeTasks.length; // 1 capsule per column
                const totalItems = doneColumns + activeColumns;
                const availableWidth = colWidth - 4; // 2px padding on each side
                const itemWidth = 25; // Base width of each bubble/capsule

                // Calculate squeeze factor (k = spacing between items)
                let k = 25; // Default spacing
                if (totalItems > 1) {
                    // How much space is available for gaps between items?
                    const maxK = (availableWidth - itemWidth) / (totalItems - 1);
                    k = Math.min(25, Math.max(3, maxK)); // Clamp: 3px ≤ k ≤ 25px
                }
                const squeeze = Math.max(0, 25 - k); // How much to overlap items (negative margin)
                const DONE_SEGMENT_PADDING = 5;
                // If both segments exist, add padding between them (accounting for squeeze)
                const containerShift = (doneColumns > 0 && activeColumns > 0) ? squeeze + DONE_SEGMENT_PADDING : 0;
                // -------------------------------------

                return (
                    <div
                        key={dateStr}
                        className="absolute top-0 bottom-0 pointer-events-auto flex items-center justify-start pl-1"
                        style={{
                            left: `${leftPos}px`,
                            width: `${colWidth}px`
                        }}
                    >
                        {/* Task Layer Content */}
                        <div className="flex items-center">

                            {/* Done Bubbles Section */}
                            {doneTasks.length > 0 && (() => {
                                const MAX_BUBBLES = 6; // Max bubbles per vertical stack
                                // Split done tasks into chunks of 6
                                const chunks = [];
                                for (let i = 0; i < doneTasks.length; i += MAX_BUBBLES) {
                                    chunks.push(doneTasks.slice(i, i + MAX_BUBBLES));
                                }
                                return (
                                    <div className="flex flex-row gap-0 mr-[2px] shrink-0 border-r border-slate-300/50 pr-[2px]">
                                        {chunks.map((chunk, colIndex) => {
                                            // Calculate vertical squeeze for this column
                                            let negativeMarginSub = 0;
                                            if (chunk.length > 3) {
                                                const availableH = 93; // Available vertical height
                                                // How much overlap is needed to fit all bubbles?
                                                const requiredOverlap = ((chunk.length * 25) - availableH) / (chunk.length - 1);
                                                negativeMarginSub = Math.min(22, Math.max(0, requiredOverlap));
                                            }

                                            return (
                                                <div key={colIndex} className="flex flex-col-reverse relative w-[25px] transition-all" style={{ marginRight: colIndex < chunks.length - 1 ? `-${squeeze}px` : '0' }}>
                                                    {chunk.map((task, i) => {
                                                        const isExpanded = expandedTaskId === task.id;
                                                        return (
                                                            <div key={task.id} className={`relative w-[25px] h-[25px] shrink-0 transition-all duration-300 ${isExpanded ? 'z-[2000]' : 'z-0 hover:z-[3000]'}`} style={{ marginBottom: i > 0 ? `-${negativeMarginSub}px` : '0px' }}>
                                                                <TaskCard
                                                                    task={task} variant={'BUBBLE'} scale={scale} index={i}
                                                                    hoverOffset={i * (25 - negativeMarginSub)}
                                                                    onTaskClick={onTaskClick} onTaskDoubleClick={onTaskDoubleClick} onContextMenu={onContextMenu}
                                                                    isExpanded={isExpanded} isSelected={selectedTaskIds.has(task.id)}
                                                                    onUpdate={onUpdate}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Active Capsules Section */}
                            <div className="flex items-center h-full relative" style={{ marginLeft: containerShift > 0 ? `-${containerShift}px` : 0 }}>
                                {activeTasks.map((task, i) => {
                                    const isExpanded = expandedTaskId === task.id;
                                    return (
                                        <div key={task.id} className={`transition-all ${isExpanded ? 'z-[2000]' : 'hover:z-[3000]'} relative`}
                                            style={{
                                                marginLeft: i > 0 ? `-${squeeze}px` : 0,
                                                // Z-index: Expanded task highest, otherwise stack order (last item on top)
                                                zIndex: isExpanded ? 2000 : (activeTasks.length - i),
                                                width: '25px', height: '93px'
                                            }}>
                                            <TaskCard
                                                task={task} variant={'CAPSULE'} scale={scale}
                                                onTaskClick={onTaskClick} onTaskDoubleClick={onTaskDoubleClick} onContextMenu={onContextMenu}
                                                isExpanded={isExpanded} isSelected={selectedTaskIds.has(task.id)}
                                                onUpdate={onUpdate}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TaskColumn;
