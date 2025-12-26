import React, { useMemo } from 'react';
import { getPixelOffsetFromStart, getDayWidth } from '../../utils/timelineMath';
import TaskCard from '../TaskCard';
import { sortTasksForDisplay } from '../../utils/taskUtils';

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
                const leftPos = getPixelOffsetFromStart(dayDate, virtualStartDate, scale || 96);
                const colWidth = getDayWidth(dayDate, scale || 96);

                // --- LOGIC COPIED FROM TIMELINE DAY CELL ---
                const sortedTasks = sortTasksForDisplay(dayTasks);
                const doneTasks = sortedTasks.filter(t => t.status === 'done');
                const activeTasks = sortedTasks.filter(t => t.status !== 'done');

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
                            {/* Done Bubbles */}
                            {doneTasks.length > 0 && (() => {
                                const MAX_BUBBLES = 6;
                                const chunks = [];
                                for (let i = 0; i < doneTasks.length; i += MAX_BUBBLES) {
                                    chunks.push(doneTasks.slice(i, i + MAX_BUBBLES));
                                }
                                return (
                                    <div className="flex flex-row gap-0 mr-[2px] shrink-0 border-r border-slate-300/50 pr-[2px]">
                                        {chunks.map((chunk, colIndex) => {
                                            let negativeMarginSub = 0;
                                            if (chunk.length > 3) {
                                                const availableH = 93;
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

                            {/* Active Capsules */}
                            <div className="flex items-center h-full relative" style={{ marginLeft: containerShift > 0 ? `-${containerShift}px` : 0 }}>
                                {activeTasks.map((task, i) => {
                                    const isExpanded = expandedTaskId === task.id;
                                    return (
                                        <div key={task.id} className={`transition-all ${isExpanded ? 'z-[2000]' : 'hover:z-[3000]'} relative`}
                                            style={{
                                                marginLeft: i > 0 ? `-${squeeze}px` : 0,
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
