import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TaskCard from './TaskCard';

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
    onTaskDoubleClick, // New Prop
    onTaskContextMenu,
    onGridContextMenu,
    safeDate,
    expandedDay,
    onExpandDay,
    expandedTaskId, // New Prop
    selectedTaskIds = new Set() // NEW: Selection state for bulk actions
}) => {
    // Row Container
    return (
        <div className={`flex border-b border-slate-200 group hover:bg-slate-50/30 transition-colors last:border-0 h-[97px] relative bg-white`}>
            {/* Colleague Info Column */}
            <div
                className={`sticky left-0 z-[30] w-50 p-4 bg-white border-r border-slate-200 flex items-center gap-3 shrink-0 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)]`}
                style={{ width: '200px' }}
            >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shadow-slate-200 shrink-0">{colleague.avatar}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-0 mb-1">
                        <p className="font-bold text-slate-900 text-[11px] tracking-tight leading-tight">{colleague.name}</p>
                    </div>
                    <div className="flex flex-col gap-0">
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.position || '---'}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.company || '---'}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.department || '---'}</p>
                        {colleague.role && (
                            <p className="text-[8px] font-bold text-teal-600 uppercase tracking-wider truncate leading-tight mt-1">
                                {(() => {
                                    const map = {
                                        user: 'MEMBER',
                                        guest: 'COLLAB',
                                        admin: 'ADMIN',
                                        god: 'SYSTEM GOD'
                                    };
                                    return map[colleague.role] || colleague.role;
                                })()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline Grid & Tasks Container */}
            <div className="flex relative shrink-0">
                {/* Horizontal Baseline */}
                <div className="absolute top-1/2 left-0 w-full h-[4px] bg-slate-400/50 -translate-y-1/2 z-0" />

                {/* Day Columns Background Layer */}
                {days.map((day, dIdx) => (
                    <div
                        key={dIdx}
                        style={{ minWidth: getColumnWidth(day) }}
                        className={`h-full border-r border-slate-200/70 flex items-center justify-center relative last:border-0 ${isToday(day) ? 'bg-teal-100/40' : isWeekend(day) ? 'bg-slate-200/40' : ''}`}
                        onContextMenu={(e) => onGridContextMenu && onGridContextMenu(day, colleague.id, e)}
                    >
                        {/* Month boundary */}
                        {day.getDate() === 1 && dIdx > 0 && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500/30 z-10 pointer-events-none" />
                        )}
                        {/* Week boundary (Pale line between Sun/Mon) */}
                        {day.getDay() === 1 && (
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/50 z-10 pointer-events-none" />
                        )}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-8 z-0 rounded-full transition-all duration-300 ${isToday(day) ? 'bg-teal-600/70 h-10' : 'bg-slate-400/70'}`} />
                    </div>
                ))}

                {/* Task Layer - Interactive Overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ width: '100%' }}>
                    <div className="absolute inset-0 flex pointer-events-none">
                        {days.map((day, dIdx) => {
                            const dayDate = new Date(day);
                            dayDate.setHours(0, 0, 0, 0);
                            const key = dayDate.toISOString();

                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isTodayCol = dayDate.getTime() === today.getTime();

                            const dailyTasks = getTasksForColleague(colleague.id).filter(t => {
                                // Floating Logic for Priority 1
                                const p = String(t.priority || '');
                                const isP1 = p === '1';
                                const isDone = t.status === 'done';

                                if (isP1 && !isDone) {
                                    // If P1 and Active, it ONLY appears on Today's column
                                    return isTodayCol;
                                }

                                // Done Task Logic: Use completedAt if available, else fallback to dueDate
                                if (isDone && t.completedAt) {
                                    const cDate = new Date(t.completedAt);
                                    cDate.setHours(0, 0, 0, 0);
                                    return cDate.getTime() === dayDate.getTime();
                                }

                                // Standard Logic (Active tasks or Done Legacy)
                                const d = safeDate(t.dueDate);
                                if (!d) return false;
                                d.setHours(0, 0, 0, 0);
                                return d.getTime() === dayDate.getTime();
                            }).sort((a, b) => {
                                // 1. Done Task Handling: Chronological History (Oldest on Left/Bottom)
                                if (a.status === 'done' && b.status === 'done') {
                                    const timeA = new Date(a.completedAt || a.updatedAt || 0).getTime();
                                    const timeB = new Date(b.completedAt || b.updatedAt || 0).getTime();
                                    return timeA - timeB; // Ascending: Oldest -> Newest
                                }

                                // 2. Separate Done from Active (Done First?)
                                if (a.status === 'done') return -1;
                                if (b.status === 'done') return 1;

                                // 3. Active Task Sorting (Priority)
                                const getScore = (task) => {
                                    const p = String(task.priority || '').toLowerCase();
                                    if (p === '1') return 0;
                                    if (p === '2' || p === 'high' || p === 'asap') return 10;
                                    if (p === '3' || p === 'medium') return 20;
                                    if (p === '4' || p === 'low') return 30;
                                    return 100;
                                };
                                const scoreA = getScore(a);
                                const scoreB = getScore(b);

                                // Tie-breaker for Priority 1 (Oldest Created First)
                                if (scoreA === 0 && scoreB === 0) {
                                    const timeA = new Date(a.createdAt || 0).getTime();
                                    const timeB = new Date(b.createdAt || 0).getTime();
                                    return timeA - timeB;
                                }

                                return scoreA - scoreB;
                            });

                            // Split Tasks: Done (Bubbles) vs Active (Capsules)
                            const doneTasks = dailyTasks.filter(t => t.status === 'done');
                            const activeTasks = dailyTasks.filter(t => t.status !== 'done');

                            const isExpanded = expandedDay === key;

                            // 1. Expanded Day Logic (Show ALL as Capsules)
                            if (isExpanded) {
                                return (
                                    <div
                                        key={dIdx}
                                        style={{ minWidth: getColumnWidth(day) }}
                                        className={`relative flex items-center justify-center h-full group/day pointer-events-auto`}
                                        onClick={() => onExpandDay(null)}
                                    >
                                        <div className={`absolute z-[100] left-1/2 -translate-x-1/2 flex flex-nowrap justify-center gap-1 w-auto`}>
                                            {dailyTasks.map((task) => (
                                                <div key={task.id} className="focus:outline-none shrink-0" style={{ width: '160px' }}>
                                                    <TaskCard
                                                        task={task}
                                                        variant={'CAPSULE'}
                                                        isStatic={true}
                                                        scale={scale}
                                                        onTaskClick={onTaskClick}
                                                        onTaskDoubleClick={onTaskDoubleClick}
                                                        onContextMenu={onTaskContextMenu}
                                                        isExpanded={expandedTaskId === task.id}
                                                        isSelected={selectedTaskIds.has(task.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            // 2. Collapsed Day Logic (Bubbles + Capsules)
                            const colWidth = getColumnWidth(day);
                            // Layout calculations...
                            const doneStackWidth = doneTasks.length > 0 ? (Math.ceil(doneTasks.length / 6) * 15) + 25 : 0;
                            const activeAvailable = colWidth - 16 - 28;
                            const totalActiveWidth = activeTasks.length * 25;
                            let negativeMargin = 0;
                            if (totalActiveWidth > activeAvailable && activeTasks.length > 1) {
                                negativeMargin = Math.min(18, (totalActiveWidth - activeAvailable) / (activeTasks.length - 1));
                            }

                            return (
                                <div
                                    key={dIdx}
                                    style={{ minWidth: colWidth }}
                                    className={`relative flex h-full group/day pointer-events-auto pl-1 pb-1 items-end`}
                                    onClick={() => onExpandDay(key)}
                                >
                                    {/* Done Task Bubbles (Smart Stacking) */}
                                    {doneTasks.length > 0 && (() => {
                                        const MAX_BUBBLES = 6;
                                        const chunks = [];
                                        for (let i = 0; i < doneTasks.length; i += MAX_BUBBLES) {
                                            chunks.push(doneTasks.slice(i, i + MAX_BUBBLES));
                                        }

                                        return (
                                            <div className="flex flex-row gap-0 mr-[2px] shrink-0 border-r border-slate-200/50 pr-[2px]">
                                                {chunks.map((chunk, colIndex) => {
                                                    // Check if any task in this column is currently expanded
                                                    const hasExpandedTask = chunk.some(t => t.id === expandedTaskId);

                                                    // ... (Margin logic unchanged) ...
                                                    let negativeMarginSub = 0;
                                                    if (chunk.length > 3) {
                                                        const availableH = 93;
                                                        // Formula: (count * 25) - ((count - 1) * overlap) <= 93
                                                        const requiredOverlap = ((chunk.length * 25) - availableH) / (chunk.length - 1);
                                                        // Cap overlap at 22px
                                                        negativeMarginSub = Math.min(22, Math.max(0, requiredOverlap));
                                                    }

                                                    return (
                                                        <div
                                                            key={colIndex}
                                                            className="flex flex-col-reverse relative w-[25px] transition-all"
                                                            style={{
                                                                marginRight: colIndex < chunks.length - 1 ? '-10px' : '0',
                                                                // REMOVED zIndex here to avoid Stacking Context Traps
                                                            }}
                                                        >
                                                            {chunk.map((task, i) => {
                                                                const effectiveHeight = 25 - negativeMarginSub;
                                                                const distanceToRowBottom = i * effectiveHeight;
                                                                const stackMargin = i > 0 ? `-${negativeMarginSub}px` : '0px';
                                                                const isExpanded = expandedTaskId === task.id;

                                                                return (
                                                                    <div
                                                                        key={task.id}
                                                                        className={`relative w-[25px] h-[25px] shrink-0 group/bubble transition-all duration-300 ${isExpanded ? 'z-[2000]' : 'z-0 hover:z-[3000]'}`}
                                                                        style={{
                                                                            marginBottom: stackMargin
                                                                        }}
                                                                    >
                                                                        <TaskCard
                                                                            task={task}
                                                                            variant={'BUBBLE'}
                                                                            scale={scale}
                                                                            index={i}
                                                                            hoverOffset={distanceToRowBottom}
                                                                            onTaskClick={onTaskClick}
                                                                            onTaskDoubleClick={onTaskDoubleClick}
                                                                            onContextMenu={onTaskContextMenu}
                                                                            isExpanded={isExpanded}
                                                                            isSelected={selectedTaskIds.has(task.id)}
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

                                    {/* Active Task Capsules */}
                                    <div className="flex items-end h-full relative">
                                        {activeTasks.map((task, i) => {
                                            const isExpanded = expandedTaskId === task.id;
                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`transition-all ${isExpanded ? 'z-[2000]' : 'hover:z-[3000]'} relative`}
                                                    style={{
                                                        marginLeft: i > 0 ? `-${negativeMargin}px` : 0,
                                                        zIndex: isExpanded ? 2000 : (activeTasks.length - i), // Base stacking for overlap
                                                        width: '25px',
                                                        height: '93px'
                                                    }}
                                                >
                                                    <TaskCard
                                                        task={task}
                                                        variant={'CAPSULE'}
                                                        scale={scale}
                                                        onTaskClick={onTaskClick}
                                                        onTaskDoubleClick={onTaskDoubleClick}
                                                        onContextMenu={onTaskContextMenu}
                                                        isExpanded={isExpanded}
                                                        isSelected={selectedTaskIds.has(task.id)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Interaction Hitbox */}
                                    <div className="absolute inset-0 hover:bg-black/5 rounded-none cursor-pointer -z-10" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(TimelineRow);
