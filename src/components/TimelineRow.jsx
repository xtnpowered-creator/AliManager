import React from 'react';
import TimelineColleagueCell from './timeline/TimelineColleagueCell';
import TimelineDayCell from './timeline/TimelineDayCell';

const TimelineRow = ({
    colleague,
    colleagueIndex,
    colleagues, // Not used directly in rendering anymore? Wrapper might need?
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
    showColleagueInfo = true
}) => {
    return (
        <div className={`flex border-b border-slate-200 group hover:bg-slate-50/30 transition-colors last:border-0 h-[97px] relative bg-white`}>
            {/* 1. Sticky Colleague Sidebar */}
            {showColleagueInfo && (
                <TimelineColleagueCell colleague={colleague} />
            )}

            {/* 2. Timeline Grid */}
            <div className="flex relative shrink-0">
                {/* Horizontal Baseline */}
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
            </div>
        </div>
    );
};

export default React.memo(TimelineRow);
