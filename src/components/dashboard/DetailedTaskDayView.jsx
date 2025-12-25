import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { sortTasksForDisplay } from '../../utils/taskUtils';
import TaskCard from '../TaskCard';

const DetailedTaskDayView = forwardRef(({
    tasks = [],
    selectedDate, // Optional: if we want to auto-scroll to a date
}, ref) => {
    const scrollContainerRef = useRef(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const animationFrameRef = useRef(null);
    const SNAP_TIMEOUT_MS = 150;

    // 1. Group & Sort Tasks
    const dayGroups = useMemo(() => {
        const groups = {};

        // Helper: Get Normalized Date Key (YYYY-MM-DD)
        const getDateKey = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.toISOString().split('T')[0];
        };

        const getTaskDate = (t) => {
            // Priority: CompletedAt -> DueDate -> CreatedAt (fallback)
            if (t.status === 'done' && t.completedAt) return new Date(t.completedAt);
            if (t.dueDate) return new Date(t.dueDate);
            return new Date(t.createdAt || Date.now());
        };

        tasks.forEach(task => {
            const date = getTaskDate(task);
            const key = getDateKey(date);
            if (!groups[key]) {
                groups[key] = {
                    date: date,
                    key: key,
                    tasks: []
                };
            }
            groups[key].tasks.push(task);
        });

        // Sort Groups by Date
        const sortedKeys = Object.keys(groups).sort();

        return sortedKeys.map(key => {
            const group = groups[key];
            // Sort Tasks within Group using centralized logic
            group.tasks = sortTasksForDisplay(group.tasks);
            return group;
        });
    }, [tasks]);

    // Expose Scroll Method
    useImperativeHandle(ref, () => ({
        scrollToDate: (targetDate) => {
            if (!scrollContainerRef.current || !targetDate) return;

            // Normalize Target
            const t = new Date(targetDate);
            t.setHours(0, 0, 0, 0);
            const targetTime = t.getTime();

            // Find group that matches or is closest NEXT match?
            // "Go To Date" usually means exact date or immediately following?
            // Let's look for exact match first, or the first one after.

            // Actually, we need to find the DOM element.
            // We can rely on data-date attributes or just find the index.
            const groupIndex = dayGroups.findIndex(g => {
                const gDate = new Date(g.date);
                gDate.setHours(0, 0, 0, 0);
                return gDate.getTime() === targetTime;
            });

            // If found, scroll to it.
            let targetGroup = null;
            let targetIndex = -1;

            if (groupIndex !== -1) {
                targetIndex = groupIndex;
            } else {
                // FAILSAFE: If no tasks for target date (e.g. Today), 
                // find the NEXT date that has tasks.
                targetIndex = dayGroups.findIndex(g => {
                    const gDate = new Date(g.date);
                    gDate.setHours(0, 0, 0, 0);
                    return gDate.getTime() > targetTime;
                });
            }

            if (targetIndex !== -1) {
                // We need the DOM element corresponding to this index.
                // The structure is: StartBoundary (index 0 child?) -> Groups...
                // Children: [StartBoundary, Group1, Group2..., EndBoundary] (if empty logic not active)
                // If empty: [StartBoundary, Spacer, EndBoundary]

                // Let's add IDs or Data attributes to groups to make lookup robust.
                // Or simplified: calc child index = targetIndex + 1 (to skip StartBoundary).

                const children = scrollContainerRef.current.children;
                // Child 0: Start Boundary
                // Child 1: Group 0
                // ...
                const targetEl = children[targetIndex + 1];

                if (targetEl) {
                    // Align Left Edge with 33px buffer per user request.
                    const scrollTarget = Math.max(0, targetEl.offsetLeft - 33);

                    scrollContainerRef.current.scrollTo({
                        left: scrollTarget,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }));

    // Checks for empty tasks moved inside render to preserve boundaries

    const handlePointerDown = (e) => {
        isDragging.current = true;
        startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollLeft.current = scrollContainerRef.current.scrollLeft;

        scrollContainerRef.current.style.cursor = 'grabbing';
        scrollContainerRef.current.style.userSelect = 'none';
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();

        // Cancel previous frame to avoid stacking
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            if (!scrollContainerRef.current) return;
            const x = e.pageX - scrollContainerRef.current.offsetLeft;
            const walk = (x - startX.current) * 1.5; // Accelerated scroll speed
            scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
        });
    };

    const handlePointerUp = () => {
        isDragging.current = false;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
            scrollContainerRef.current.style.userSelect = 'auto';
        }
    };

    // Non-passive wheel listener for headers to prevent page scroll
    React.useEffect(() => {
        const handleHeaderWheel = (e) => {
            if (e.deltaY !== 0 && scrollContainerRef.current) {
                e.preventDefault();
                scrollContainerRef.current.scrollLeft += e.deltaY;
            }
        };

        const headers = document.querySelectorAll('.dayview-header-scroll-target');
        headers.forEach(el => el.addEventListener('wheel', handleHeaderWheel, { passive: false }));

        return () => {
            headers.forEach(el => el.removeEventListener('wheel', handleHeaderWheel));
        };
    }, [dayGroups]); // Re-bind when groups change

    return (
        <div
            ref={scrollContainerRef}
            className="w-full h-auto min-h-0 overflow-x-auto overflow-y-hidden flex flex-row gap-0 bg-white rounded-2xl border border-slate-300 shadow-sm custom-scrollbar cursor-grab"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* START BOUNDARY */}
            <div
                className="flex flex-col shrink-0 justify-center items-center w-12 min-w-[48px] border-r border-slate-900"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #f97316, #f97316 10px, #ffffff 10px, #ffffff 20px)'
                }}
            >
                <span
                    className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap bg-white px-1 py-3 shadow-sm border border-slate-200"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                    NO MORE TASKS THIS DIRECTION
                </span>
            </div>

            {dayGroups.length > 0 ? (
                dayGroups.map((group) => {
                    const isToday = group.date.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);

                    return (
                        <div key={group.key} className="flex flex-col shrink-0 min-w-[200px] border-r border-slate-300 pt-0 pb-0 bg-transparent">
                            {/* Timeline-Style Header (Left Aligned) */}
                            <div
                                className={`dayview-header-scroll-target flex flex-col items-start justify-center h-[73px] shrink-0 select-none px-4 box-border cursor-ew-resize ${isToday ? 'bg-teal-100/70' : ''}`}
                            >
                                <p className={`text-[10px] font-black uppercase tracking-tight leading-none ${isToday ? 'text-teal-700' : 'text-slate-500'}`}>
                                    {group.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                                <p className={`text-[17px] font-black mt-0.5 mb-0 ${isToday ? 'text-teal-950' : 'text-slate-900'}`}>
                                    {group.date.getDate()}
                                </p>
                                <div className="flex flex-wrap justify-start items-center gap-x-0.5 leading-[1.0] w-full text-left">
                                    <p className={`text-[10px] font-black uppercase tracking-tight ${isToday ? 'text-teal-700' : 'text-slate-500'}`}>
                                        {group.date.toLocaleDateString('en-US', { month: 'short' })}
                                    </p>
                                    {group.date.getFullYear() !== new Date().getFullYear() && (
                                        <p className={`text-[10px] font-black uppercase tracking-tight ${isToday ? 'text-teal-700' : 'text-slate-500'}`}>
                                            {group.date.getFullYear()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Continuous Row of Tasks for this Day */}
                            <div className={`flex flex-row items-stretch gap-1 h-auto border-y-2 border-slate-900 p-0.5 ${isToday ? 'bg-teal-100/40' : 'bg-white/50'}`}>
                                {group.tasks.map((task, i) => (
                                    <div key={task.id} className="w-[240px] h-40 shrink-0">
                                        <TaskCard
                                            task={task}
                                            variant="DAYVIEW_DETAILED"
                                            index={i}
                                            isStatic={true} // Force relative positioning
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                // SPACER FOR EMPTY STATE (Width of one task)
                <div className="flex flex-col shrink-0 justify-center items-center w-[240px] border-r border-slate-300 bg-slate-50/50">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-wide">
                        NO TASKS DISPLAYED
                    </span>
                </div>
            )}

            {/* END BOUNDARY */}
            <div
                className="flex flex-col shrink-0 justify-center items-center w-12 min-w-[48px] border-r border-slate-900"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #f97316, #f97316 10px, #ffffff 10px, #ffffff 20px)'
                }}
            >
                <span
                    className="text-[10px] font-black text-slate-900 uppercase whitespace-nowrap bg-white px-1 py-3 shadow-sm border border-slate-200"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                    NO MORE TASKS THIS DIRECTION
                </span>
            </div>
        </div>
    );
});

export default DetailedTaskDayView;
