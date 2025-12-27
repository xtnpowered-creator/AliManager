import React from 'react';

/**
 * TimelineHeader Component
 * 
 * Renders the sticky header row displaying dates across the timeline view.
 * Features dynamic column widths (weekends are compressed), visual indicators
 * for today and month boundaries, and adaptive text display based on scale.
 * 
 * Layout:
 * - Sticky at top with z-index 200 to stay above timeline body
 * - Optional sidebar (200px) showing "COLLEAGUES" label when showSidebar=true
 * - Date columns that scroll horizontally
 * 
 * Visual Features:
 * - Teal vertical line marks start of each month (day 1)
 * - Slate vertical line marks start of each week (Monday)
 * - Today's date highlighted with teal background
 * - Weekends have slate background
 * - Date content hidden on weekends when scale < 72px (0.75 inches)
 * 
 * @param {Object} props
 * @param {Array<Date>} props.days - Array of Date objects to render
 * @param {Function} props.getColumnWidth - Returns pixel width for a given date
 * @param {Function} props.isToday - Returns true if date is today
 * @param {Function} props.isWeekend - Returns true if date is Saturday/Sunday
 * @param {Function} props.onContextMenu - Handler for right-click menu
 * @param {boolean} props.showSidebar - Whether to display the colleague sidebar
 * @param {number} props.width - Optional width override (unused, consider removing)
 * @param {Function} props.onWheel - Handler for horizontal scrolling via mouse wheel
 * @param {number} props.scale - Pixels per weekday column (default: 96)
 */
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
            {/* Colleague Sidebar Label (Sticky Left) */}
            {showSidebar && (
                <div className="sticky left-0 z-[205] p-6 bg-slate-50/95 border-r border-slate-300 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center shrink-0" style={{ width: '200px' }}>
                    Colleagues
                </div>
            )}

            {/* Date Columns */}
            <div className="flex">
                {days.map((day, i) => {
                    const isWknd = isWeekend(day);
                    // Hide text content on weekends when scale is too small (< 0.75 inches)
                    const showContent = !isWknd || (scale >= 72); // 0.75 * 96 = 72

                    return (
                        <div key={i}
                            style={{ width: getColumnWidth(day), minWidth: getColumnWidth(day) }}
                            onContextMenu={(e) => onContextMenu(e, 'header', { date: day })}
                            className={`flex flex-col items-center justify-center py-1 border-r border-slate-300 last:border-0 relative shrink-0 ${isToday(day) ? 'bg-teal-100/70' : isWknd ? 'bg-slate-200/70' : ''}`}
                        >
                            {/* Month Start Indicator (1st of month) */}
                            {day.getDate() === 1 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500 z-50 pointer-events-none" />}

                            {/* Week Start Indicator (Monday) */}
                            {day.getDay() === 1 && <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/60 z-40 pointer-events-none" />}

                            {/* Date Content (Hidden on narrow weekends) */}
                            {showContent && (
                                <>
                                    {/* Weekday abbreviation (e.g., "Mon") */}
                                    <p className={`text-[10px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>

                                    {/* Day number (e.g., "15") */}
                                    <p className={`text-[17px] font-black mt-0.5 mb-0 ${isToday(day) ? 'text-teal-950' : 'text-slate-900'}`}>{day.getDate()}</p>

                                    {/* Month + Year (if not current year) */}
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
