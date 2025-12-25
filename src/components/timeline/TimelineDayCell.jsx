import React from 'react';
import TaskCard from '../TaskCard'; // Adjust path if needed, likely ../TaskCard

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

    const dailyTasks = getTasksForColleague(colleagueId).filter(t => {
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
    }).sort((a, b) => {
        if (a.status === 'done' && b.status === 'done') {
            return new Date(a.completedAt || a.updatedAt || 0).getTime() - new Date(b.completedAt || b.updatedAt || 0).getTime();
        }
        if (a.status === 'done') return -1;
        if (b.status === 'done') return 1;

        const getScore = (task) => {
            const p = String(task.priority || '').toLowerCase();
            return (p === '1') ? 0 : (p === '2' || p === 'high') ? 10 : (p === '3' || p === 'medium') ? 20 : 100;
        };
        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreA === scoreB) {
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        return scoreA - scoreB;
    });

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
            style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
            className={`flex-none h-full border-r border-slate-300/70 flex items-center justify-center relative last:border-0 group/day ${isToday(day) ? 'bg-teal-100/40' : isWeekend(day) ? 'bg-slate-200/40' : ''}`}
            onContextMenu={(e) => onGridContextMenu && onGridContextMenu(day, colleagueId, e)}
        >
            {/* Visual Guides */}
            {day.getDate() === 1 && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500/30 z-10 pointer-events-none" />
            )}
            {/* Center Line visual */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-8 z-0 rounded-full transition-all duration-300 ${isToday(day) ? 'bg-teal-600/70 h-10' : 'bg-slate-400/70'}`} />

            {/* Task Layer */}
            <div className="absolute inset-0 flex items-center pl-1 pointer-events-auto z-20">
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
                                                        onTaskClick={onTaskClick} onTaskDoubleClick={onTaskDoubleClick} onContextMenu={onTaskContextMenu}
                                                        isExpanded={isExpanded} isSelected={selectedTaskIds.has(task.id)}
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
                <div className="flex items-center h-full relative pointer-events-none" style={{ marginLeft: containerShift > 0 ? `-${containerShift}px` : 0 }}>
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
                                    onTaskClick={onTaskClick} onTaskDoubleClick={onTaskDoubleClick} onContextMenu={onTaskContextMenu}
                                    isExpanded={isExpanded} isSelected={selectedTaskIds.has(task.id)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="absolute inset-0 hover:bg-black/5 rounded-none cursor-pointer -z-10" />
        </div>
    );
};

export default React.memo(TimelineDayCell);
