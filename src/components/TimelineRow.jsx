import React from 'react';
import TimelineColleagueCell from './timeline/TimelineColleagueCell';
import TimelineDayCell from './timeline/TimelineDayCell';
import TaskColumn from './timeline/TaskColumn';

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
            {showColleagueInfo && (
                <TimelineColleagueCell colleague={colleague} />
            )}

            <div className="flex relative shrink-0">

                {/* Horizontal baseline creates visual connection across timeline days */}
                <div className="absolute top-1/2 left-0 w-full h-[4px] bg-slate-400/50 -translate-y-1/2 z-0" />

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

                {/* Task overlay: positioned above day cells via z-index, pointer-events-none allows clicks to pass through to grid */}
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
