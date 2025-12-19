import React from 'react';
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
    setScrollDirection,
    scrollContainerRef,
    draggingTask,
    setDraggingTask,
    ghostRef,
    onReassign,
    isDragDisabled,
    safeDate,
    scale,
    onColleagueDragStart,
    isDraggingThis
}) => {

    return (
        <div className={`flex border-b border-slate-300 group hover:bg-slate-50/30 transition-colors last:border-0 h-[160px] relative bg-white ${isDraggingThis ? 'opacity-30' : ''}`}>
            {/* Colleague Info Column */}
            <div
                onMouseDown={isDragDisabled ? undefined : onColleagueDragStart}
                className={`sticky left-0 z-[9999] w-50 p-4 bg-white border-r border-slate-300 flex items-center gap-3 shrink-0 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)] ${isDragDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                style={{ width: '200px' }}
            >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shadow-slate-200 shrink-0">{colleague.avatar}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-0 mb-1">
                        <p className="font-bold text-slate-900 text-[11px] truncate uppercase tracking-tight leading-tight">{colleague.name.split(' ')[0]}</p>
                        <p className="font-bold text-slate-900 text-[11px] truncate uppercase tracking-tight leading-tight">{colleague.name.split(' ').slice(1).join(' ')}</p>
                    </div>
                    <div className="flex flex-col gap-0">
                        {colleague.company && <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.company}</p>}
                        {colleague.department && <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.department}</p>}
                        {colleague.role && <p className="text-[8px] font-bold text-teal-600 uppercase tracking-wider truncate leading-tight">{colleague.role}</p>}
                    </div>
                </div>
            </div>

            {/* Timeline Grid & Tasks */}
            <div className="flex relative shrink-0">
                {/* Horizontal Baseline */}
                <div className="absolute top-1/2 left-0 w-full h-[4px] bg-slate-400/50 -translate-y-1/2 z-0" />

                {/* Day Columns */}
                {days.map((day, dIdx) => (
                    <div key={dIdx} style={{ minWidth: getColumnWidth(day) }} className={`h-full border-r border-slate-300/70 flex items-center justify-center relative last:border-0 ${isToday(day) ? 'bg-teal-100/40' : isWeekend(day) ? 'bg-slate-200/40' : ''}`}>
                        {/* Month boundary */}
                        {day.getDate() === 1 && dIdx > 0 && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500/30 z-10 pointer-events-none" />
                        )}
                        {/* Week boundary (Pale line between Sun/Mon) */}
                        {day.getDay() === 1 && (
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/50 z-10 pointer-events-none" />
                        )}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-8 z-0 rounded-full ${isToday(day) ? 'bg-teal-600/70' : 'bg-slate-400/70'}`} />
                    </div>
                ))}

                {/* Task Layer - Absolute positioning over the row */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ clipPath: 'inset(0 0 0 0)' }}>
                    {(() => {
                        const colleagueTasks = getTasksForColleague(colleague.id);
                        if (!colleagueTasks.length) return null;

                        // 1. Sort tasks: earlier first, then higher priority
                        // 1. Sort tasks: earlier first, then higher priority
                        // Normalize dates for sorting to match visual order
                        const normalize = (d) => {
                            const date = safeDate(d);
                            if (!date) return new Date(0);
                            date.setHours(0, 0, 0, 0);
                            return date;
                        };

                        const prioScore = { high: 0, medium: 1, low: 2 };
                        const sorted = [...colleagueTasks].sort((a, b) => {
                            const dateA = normalize(a.dueDate);
                            const dateB = normalize(b.dueDate);
                            if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;

                            const prioDiff = (prioScore[a.priority] ?? 1) - (prioScore[b.priority] ?? 1);
                            if (prioDiff !== 0) return prioDiff;

                            // Tertiary sort: Time of day (Earliest first)
                            const timeA = safeDate(a.dueDate).getTime();
                            const timeB = safeDate(b.dueDate).getTime();
                            return timeA - timeB;
                        });

                        // 2. Assign lanes based on overlap
                        const lanes = []; // Each element is an array of tasks in that lane
                        const taskToLane = new Map();

                        sorted.forEach(task => {
                            // Use normalized dates for overlap check
                            // This ensures visual overlap matches logical overlap
                            const taskStart = normalize(task.dueDate);
                            const taskEnd = new Date(taskStart);
                            taskEnd.setDate(taskStart.getDate() + (task.duration || 1));

                            let assignedLane = -1;
                            for (let i = 0; i < lanes.length; i++) {
                                // Check for any overlap in this lane
                                const hasOverlap = lanes[i].some(lt => {
                                    const ltStart = normalize(lt.dueDate);
                                    const ltEnd = new Date(ltStart);
                                    ltEnd.setDate(ltStart.getDate() + (lt.duration || 1));

                                    // Tasks overlap if (StartA < EndB) AND (EndA > StartB)
                                    // Strict inequality ensures adjacent days don't overlap
                                    return (taskStart < ltEnd && taskEnd > ltStart);
                                });
                                if (!hasOverlap) {
                                    assignedLane = i;
                                    lanes[i].push(task);
                                    break;
                                }
                            }

                            if (assignedLane === -1) {
                                assignedLane = lanes.length;
                                lanes.push([task]);
                            }
                            taskToLane.set(task.id, assignedLane);
                        });

                        return sorted.map((task) => {
                            const rawTaskDate = safeDate(task.dueDate);
                            if (!rawTaskDate) return null;

                            // Normalize task date to local midnight to match 'days' array
                            // This prevents time-of-day offsets from shifting the card to the wrong column
                            const taskDate = new Date(rawTaskDate);
                            taskDate.setHours(0, 0, 0, 0);

                            // Calculate left offset relative to the first day of the timeline
                            const firstDay = days[0];
                            const msPerDay = 1000 * 60 * 60 * 24;
                            const dayDiff = Math.round((taskDate - firstDay) / msPerDay);

                            let left = 0;
                            if (dayDiff >= 0) {
                                // Task starts on or after the first visible day
                                for (let i = 0; i < dayDiff && i < days.length; i++) {
                                    left += getColumnWidth(days[i]);
                                }
                            } else {
                                // Task starts BEFORE the first visible day (negative offset)
                                const tempDate = new Date(taskDate);
                                while (tempDate < firstDay) {
                                    left -= getColumnWidth(tempDate);
                                    tempDate.setDate(tempDate.getDate() + 1);
                                }
                            }

                            // Do not render if the task is completely off-screen to the left (ends before start)
                            // or completely to the right (starts after end)
                            // Note: We already know it overlaps some lane, but optimization check:
                            const taskEnd = new Date(taskDate);
                            taskEnd.setDate(taskDate.getDate() + (task.duration || 1));
                            if (taskEnd < firstDay) return null; // Ends before window starts

                            // Important: dayDiff could be larger than days.length if starts after window.
                            // But usually sorted/filtered tasks are within reason.
                            // If it starts way after, we render it far right.

                            return (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={taskToLane.get(task.id)} // This is now the lane index
                                    left={left}
                                    currentDate={taskDate}
                                    currentColleagueId={colleague.id}
                                    colleagues={colleagues}
                                    colleagueIndex={colleagueIndex}
                                    getColumnWidth={getColumnWidth}
                                    onUpdate={onUpdate}
                                    setScrollDirection={setScrollDirection}
                                    scrollContainerRef={scrollContainerRef}
                                    draggingTask={draggingTask}
                                    setDraggingTask={setDraggingTask}
                                    ghostRef={ghostRef}
                                    onReassign={onReassign}
                                    days={days}
                                />
                            );
                        });
                    })()}
                </div>
            </div>
        </div>
    );
};

export default TimelineRow;

