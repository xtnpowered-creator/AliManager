import React from 'react';
import TimelineRow from '../TimelineRow'; // Implied needing parent dir import, check path

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
                    className={cIdx === 0
                        ? "sticky top-[73px] z-[150] shadow-xl border-y-2 border-slate-900 bg-white"
                        : `border-t border-slate-300 ${cIdx === colleagues.length - 1 ? 'border-b' : ''}`}
                    style={cIdx === 0 ? {} : {
                        contentVisibility: 'auto',
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
