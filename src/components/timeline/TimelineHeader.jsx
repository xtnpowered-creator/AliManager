import React from 'react';

const TimelineHeader = ({
    days,
    getColumnWidth,
    isToday,
    isWeekend,
    onContextMenu,
    showSidebar,
    width, // Optional override
    onWheel, // New prop for horizontal scrolling
    scale = 96 // Default to standard if missing
}) => {
    return (
        <div className="flex sticky top-0 z-[200] bg-white/80 backdrop-blur-md border-b border-slate-200 min-w-max h-[73px] cursor-ew-resize" onWheel={onWheel}>
            {showSidebar && (
                <div className="sticky left-0 z-[205] p-6 bg-slate-50/95 border-r border-slate-300 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center shrink-0" style={{ width: '200px' }}>
                    Colleagues
                </div>
            )}

            <div className="flex">
                {days.map((day, i) => {
                    const isWknd = isWeekend(day);
                    const showContent = !isWknd || (scale >= 72); // 0.75 * 96 = 72

                    return (
                        <div key={i}
                            style={{ width: getColumnWidth(day), minWidth: getColumnWidth(day) }}
                            onContextMenu={(e) => onContextMenu(e, 'header', { date: day })}
                            className={`flex flex-col items-center justify-center py-1 border-r border-slate-300 last:border-0 relative shrink-0 ${isToday(day) ? 'bg-teal-100/70' : isWknd ? 'bg-slate-200/70' : ''}`}
                        >
                            {day.getDate() === 1 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500 z-50 pointer-events-none" />}
                            {day.getDay() === 1 && <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/60 z-40 pointer-events-none" />}

                            {showContent && (
                                <>
                                    <p className={`text-[10px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className={`text-[17px] font-black mt-0.5 mb-0 ${isToday(day) ? 'text-teal-950' : 'text-slate-900'}`}>{day.getDate()}</p>
                                    <div className="flex flex-wrap justify-center items-center gap-x-0.5 leading-[1.0] text-center w-full px-0.5">
                                        <p className={`text-[10px] font-black uppercase tracking-tight ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { month: 'short' })}</p>
                                        {day.getFullYear() !== new Date().getFullYear() && (
                                            <p className={`text-[10px] font-black uppercase tracking-tight ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>
                                                {day.getFullYear()}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelineHeader;
