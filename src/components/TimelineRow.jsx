import React, { memo } from 'react';
import TaskCard from './TaskCard';
import { GripVertical } from 'lucide-react';

const TimelineRow = ({
    colleague,
    colleagueIndex,
    colleagues,
    days,
    getColumnWidth,
    isToday,
    isWeekend,
    getTasksForDay,
    onUpdate,
    setScrollDirection,
    scrollContainerRef,
    draggingTask,
    setDraggingTask,
    ghostRef,
    onReassign,
    dragControls,
    isDragDisabled
}) => {
    // Add drag handle trigger
    const handleDragStart = (e) => {
        if (!isDragDisabled) dragControls?.start(e);
    };

    return (
        <div className="flex border-b border-slate-200 group hover:bg-slate-50/30 transition-colors last:border-0 h-48 relative bg-white">
            <div className="sticky left-0 z-20 w-56 p-6 bg-white border-r border-slate-200 flex items-center gap-3 shrink-0 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)]">
                <div
                    onPointerDown={handleDragStart}
                    className={`p-1 -ml-2 transition-colors ${isDragDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600'}`}
                >
                    <GripVertical size={16} />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shadow-slate-200">{colleague.avatar}</div>
                <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">{colleague.name}</p>
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest truncate">{colleague.role}</p>
                </div>
            </div>
            <div className="flex relative shrink-0">
                <div className="absolute top-1/2 left-0 w-full h-[4px] bg-slate-400/50 -translate-y-1/2 z-0" />
                {days.map((day, dIdx) => (
                    <div key={dIdx} style={{ minWidth: getColumnWidth(day) }} className={`h-full border-r border-slate-200/50 flex items-center justify-center relative last:border-0 ${isToday(day) ? 'bg-teal-100/40' : isWeekend(day) ? 'bg-slate-200/40' : ''}`}>
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-8 z-0 rounded-full ${isToday(day) ? 'bg-teal-600/70' : 'bg-slate-400/70'}`} />
                        <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
                            {getTasksForDay(colleague.id, day).map((task, tIdx) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={tIdx}
                                    currentDate={day}
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
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(TimelineRow);
