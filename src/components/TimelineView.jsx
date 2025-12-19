import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApiData } from '../hooks/useApiData';
import { apiClient } from '../api/client';
import { Clock, Calendar, GripVertical } from 'lucide-react';
import AssignmentConflictModal from './AssignmentConflictModal';
import { addScrollTestData } from '../utils/addTestData';
import TimelineRow from './TimelineRow';
import TimelineFilters from './TimelineFilters';
import { getTaskCardColor } from '../utils/cardStyles';

// Helper to safely parse any date-like input into a Date object
const safeDate = (dateVal) => {
    if (!dateVal) return null;
    // Handle Firestore Timestamp (legacy, harmless to keep for a bit)
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    // Handle ISO string or Date object
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
};

const TimelineView = ({ highlightTaskId }) => {
    const { data: tasks, refetch: refetchTasks } = useApiData('/tasks');
    const { data: colleagues } = useApiData('/colleagues');
    const { data: projectsData } = useApiData('/projects');

    // Deep Link Effect
    useEffect(() => {
        if (highlightTaskId && tasks.length > 0) {
            const targetTask = tasks.find(t => t.id === highlightTaskId);
            if (targetTask && targetTask.dueDate) {
                console.log("Deep Link: Scrolling to Task Date", targetTask.dueDate);
                const date = safeDate(targetTask.dueDate);
                if (date) scrollToDate(date, true);
            }
        }
    }, [highlightTaskId, tasks]);

    // Filter State
    const [filterText, setFilterText] = useState('');

    // Order state
    const [orderedColleagues, setOrderedColleagues] = useState([]);

    // Sync colleagues with local storage order
    useEffect(() => {
        if (colleagues.length === 0) return;

        const savedOrder = JSON.parse(localStorage.getItem('colleagueOrder') || '[]');

        // Create map for quick lookup
        const colleagueMap = new Map(colleagues.map(c => [c.id, c]));

        // Reconstruct list based on saved order
        const newOrder = [];
        const seenIds = new Set();

        // Add existing colleagues in saved order
        savedOrder.forEach(id => {
            if (colleagueMap.has(id)) {
                newOrder.push(colleagueMap.get(id));
                seenIds.add(id);
            }
        });

        // Append any new colleagues not in saved order
        colleagues.forEach(c => {
            if (!seenIds.has(c.id)) {
                newOrder.push(c);
            }
        });

        // Ensure Alisara Plyler is always at the top (unless manually reordered)
        // Only enforce this if there's no saved order or if it's the first load
        if (savedOrder.length === 0) {
            const alisaraIndex = newOrder.findIndex(c => c.name === 'Alisara Plyler');
            if (alisaraIndex > 0) {
                const [alisara] = newOrder.splice(alisaraIndex, 1);
                newOrder.unshift(alisara);
            }
        }

        setOrderedColleagues(newOrder);
    }, [colleagues]);

    const handleReorder = (newOrder) => {
        setOrderedColleagues(newOrder);
        const ids = newOrder.map(c => c.id);
        localStorage.setItem('colleagueOrder', JSON.stringify(ids));
    };

    // View State
    const [scale, setScale] = useState('3w'); // '1w', '3w', '5w'
    const scrollContainerRef = useRef(null);
    const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    const [scrollDirection, setScrollDirection] = useState(0);
    const [verticalScrollDirection, setVerticalScrollDirection] = useState(0);
    const scrollInterval = useRef(null);
    const verticalScrollInterval = useRef(null);
    const [isDraggingColleague, setIsDraggingColleague] = useState(false);
    const [draggingColleague, setDraggingColleague] = useState(null);
    const dragColleagueDataRef = useRef(null);
    const colleagueGhostRef = useRef(null);

    // Dragging task state - only for showing/hiding ghost, not position
    const [draggingTask, setDraggingTask] = useState(null);
    const ghostRef = useRef(null);

    // Assignment conflict state
    const [pendingReassignment, setPendingReassignment] = useState(null);

    useEffect(() => {
        if (scrollDirection !== 0) {
            scrollInterval.current = setInterval(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft += scrollDirection * 20;
                }
            }, 16);
        } else {
            clearInterval(scrollInterval.current);
        }
        return () => clearInterval(scrollInterval.current);
    }, [scrollDirection]);

    // Vertical auto-scroll for colleague reordering
    useEffect(() => {
        if (verticalScrollDirection !== 0) {
            verticalScrollInterval.current = setInterval(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop += verticalScrollDirection * 20;
                }
            }, 16);
        } else {
            clearInterval(verticalScrollInterval.current);
        }
        return () => clearInterval(verticalScrollInterval.current);
    }, [verticalScrollDirection]);

    const days = useMemo(() => {
        const result = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0); // Normalize to local midnight
        start.setDate(start.getDate() - 90);
        for (let i = 0; i < 180; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            result.push(date);
        }
        return result;
    }, []);

    const getColumnWidth = (date) => {
        const baseWidth = {
            '1w': 233, // 233 * 7 = 1631
            '3w': 77,  // 77 * 21 = 1617
            '5w': 46   // 46 * 35 = 1610
        }[scale] || 77;

        // Weekend columns are 50% of weekday width
        return isWeekend(date) ? baseWidth * 0.5 : baseWidth;
    };

    const isWeekend = (date) => [0, 6].includes(date.getDay());
    const isToday = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
    };

    // Derived Data for Filters


    const filteredTasks = useMemo(() => {
        if (!filterText) return tasks;
        const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);

        // Map projects for easy lookup
        const projectMap = new Map(projectsData?.map(p => [p.id, p.title?.toLowerCase() || '']) || []);
        // Map colleagues for easy lookup
        const colleagueMap = new Map(colleagues?.map(c => [c.id, c.name?.toLowerCase() || '']) || []);

        return tasks.filter(t => {
            // Every token must match SOME attribute of the task
            return tokens.every(token => {
                const matchesTask = t.title?.toLowerCase().includes(token);
                const matchesProject = t.projectId && projectMap.get(t.projectId)?.includes(token);
                const matchesPriority = t.priority?.toLowerCase().includes(token);
                const matchesColleague = t.assignedTo?.some(uid => colleagueMap.get(uid)?.includes(token));

                return matchesTask || matchesProject || matchesPriority || matchesColleague;
            });
        });
    }, [tasks, filterText, projectsData, colleagues]);

    const visibleColleagues = useMemo(() => {
        // If no filter, return all ordered
        if (!filterText) return orderedColleagues;

        const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);

        // Use filteredTasks as the source of truth for visibility
        const activeVisibleIds = new Set();
        filteredTasks.forEach(t => {
            t.assignedTo?.forEach(uid => activeVisibleIds.add(uid));
        });

        // Also include colleagues whose NAME matches ALL tokens
        const matchesByName = orderedColleagues.filter(c => {
            const name = c.name?.toLowerCase() || '';
            return tokens.every(token => name.includes(token));
        });

        // Build composite set
        const unionIds = new Set([
            ...matchesByName.map(c => c.id),
            ...[...activeVisibleIds]
        ]);

        return orderedColleagues.filter(c => unionIds.has(c.id));
    }, [orderedColleagues, filteredTasks, filterText]);

    const isFiltering = !!filterText;

    const getTasksForColleague = (colleagueId) => {
        return filteredTasks.filter(t => t.assignedTo?.includes(colleagueId));
    };

    // Scroll Helper
    const getOffsetForDate = (targetDate) => {
        const targetTime = targetDate.getTime();
        let offset = 0;
        for (const day of days) {
            if (day.getTime() === targetTime) break;
            offset += getColumnWidth(day);
        }
        return offset;
    };

    const getDateAtOffset = (scrollLeft, viewportWidth) => {
        // Anchor to the visual "start" of the content area (Sidebar is 200px + ~60px buffer)
        const anchorOffset = scrollLeft + 260;
        let currentOffset = 0;
        for (const day of days) {
            const width = getColumnWidth(day);
            if (anchorOffset >= currentOffset && anchorOffset < currentOffset + width) {
                return day;
            }
            currentOffset += width;
        }
        return days[Math.floor(days.length / 2)]; // Fallback
    };

    const scrollToDate = (date, smooth = true) => {
        if (!scrollContainerRef.current) return;
        const offset = getOffsetForDate(date);

        // Align to left-center (Sidebar + buffer)
        // We want the date to start at visual pixel 260
        const targetScrollLeft = offset - 260;

        scrollContainerRef.current.scrollTo({
            left: targetScrollLeft,
            behavior: smooth ? 'smooth' : 'auto'
        });
    };

    const handleToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scrollToDate(today, true);
    };

    // Keep track of the date we want to focus on after a scale change
    const preserveDateRef = useRef(null);

    const handleScaleChange = (newScale) => {
        if (scrollContainerRef.current) {
            // Capture current center date
            const centerDate = getDateAtOffset(
                scrollContainerRef.current.scrollLeft,
                scrollContainerRef.current.clientWidth
            );
            preserveDateRef.current = centerDate;
        }
        setScale(newScale);
    };

    // Initial scroll and scale handling
    React.useLayoutEffect(() => {
        if (preserveDateRef.current) {
            // Restore position to previous center date
            scrollToDate(preserveDateRef.current, false);
            preserveDateRef.current = null;
        } else {
            // Initial load - jump to today immediately
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            scrollToDate(today, false);
        }
    }, [scale]);

    const handleMouseDown = (e) => {
        if (e.target.closest('.no-pan') || e.target.closest('.task-card')) return;
        setIsDraggingTimeline(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeftState(scrollContainerRef.current.scrollLeft);
        scrollContainerRef.current.classList.add('cursor-grabbing');
    };

    const handleMouseMove = (e) => {
        if (!isDraggingTimeline) return;
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX);
        scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
    };

    const handleMouseUp = () => {
        setIsDraggingTimeline(false);
        scrollContainerRef.current?.classList.remove('cursor-grabbing');
    };

    // Custom colleague drag handlers
    const handleColleagueDragStart = (colleague, colleagueIndex, e) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        dragColleagueDataRef.current = {
            colleagueId: colleague.id,
            startIndex: colleagueIndex,
            startY: e.clientY,
            startScrollTop: scrollContainerRef.current.scrollTop,
            offsetX,
            offsetY
        };

        setDraggingColleague({
            colleague,
            x: e.clientX,
            y: e.clientY,
            offsetX,
            offsetY
        });
        setIsDraggingColleague(true);

        document.addEventListener('mousemove', handleColleagueGlobalMouseMove);
        document.addEventListener('mouseup', handleColleagueGlobalMouseUp);
    };

    const handleColleagueGlobalMouseMove = (e) => {
        if (!dragColleagueDataRef.current) return;

        const { offsetX, offsetY } = dragColleagueDataRef.current;

        // Track current position in ref for accurate drop calculation
        dragColleagueDataRef.current.currentY = e.clientY;

        // Update ghost ref position immediately for smooth dragging
        if (colleagueGhostRef.current) {
            colleagueGhostRef.current.style.left = `${e.clientX - offsetX}px`;
            colleagueGhostRef.current.style.top = `${e.clientY - offsetY}px`;
        }

        // Update state for reordering calculation
        setDraggingColleague(prev => ({
            ...prev,
            x: e.clientX,
            y: e.clientY
        }));

        // Auto-scroll logic
        const rect = scrollContainerRef.current?.getBoundingClientRect();
        if (rect) {
            const edgeThreshold = 100;
            const distanceFromTop = e.clientY - rect.top;
            const distanceFromBottom = rect.bottom - e.clientY;

            if (distanceFromTop < edgeThreshold && distanceFromTop > 0) {
                setVerticalScrollDirection(-1);
            } else if (distanceFromBottom < edgeThreshold && distanceFromBottom > 0) {
                setVerticalScrollDirection(1);
            } else {
                setVerticalScrollDirection(0);
            }
        }
    };

    const handleColleagueGlobalMouseUp = () => {
        if (!dragColleagueDataRef.current) return;

        const { startIndex, startY, startScrollTop, currentY } = dragColleagueDataRef.current;
        const currentScrollTop = scrollContainerRef.current.scrollTop;
        const scrollDelta = currentScrollTop - startScrollTop;
        const finalY = currentY || startY; // Use tracked Y or fallback to startY
        const totalDeltaY = (finalY - startY) + scrollDelta;

        const rowHeight = 160;
        const indexDelta = Math.round(totalDeltaY / rowHeight);
        const newIndex = Math.max(0, Math.min(visibleColleagues.length - 1, startIndex + indexDelta));

        if (newIndex !== startIndex) {
            const newOrder = [...visibleColleagues];
            const [movedColleague] = newOrder.splice(startIndex, 1);
            newOrder.splice(newIndex, 0, movedColleague);
            handleReorder(newOrder);
        }

        document.removeEventListener('mousemove', handleColleagueGlobalMouseMove);
        document.removeEventListener('mouseup', handleColleagueGlobalMouseUp);

        dragColleagueDataRef.current = null;
        setDraggingColleague(null);
        setIsDraggingColleague(false);
        setVerticalScrollDirection(0);
    };

    const handleUpdateTask = async (taskId, newDate, newColleagueId) => {
        try {
            const updates = {};
            if (newDate) updates.dueDate = newDate.toISOString();
            if (newColleagueId) updates.assignedTo = [newColleagueId]; // Default behavior (drag within same colleague or date change)

            await apiClient.patch(`/tasks/${taskId}`, updates);
            refetchTasks(); // Refresh data to reflect changes
        } catch (err) {
            console.error("Error updating task:", err);
        }
    };

    const handleReassignRequest = (taskId, newColleagueId, newDate) => {
        const colleague = colleagues.find(c => c.id === newColleagueId);
        setPendingReassignment({
            taskId,
            newColleagueId,
            newDate,
            colleagueName: colleague?.name || 'Colleague'
        });
    };

    const handleAssignmentAction = async (action) => {
        if (!pendingReassignment) return;

        try {
            const { taskId, newColleagueId, newDate } = pendingReassignment;
            const updates = {};

            if (newDate) updates.dueDate = newDate.toISOString();

            // We need to fetch the current task to know its current assignments for 'add' logic
            // But since we are patching, we can just send the new array if we knew it.
            // For now, let's simplify:
            // 'reassign' -> replace array
            // 'add' -> append to array (requires knowing current)

            // To make 'add' work properly with a simple PATCH, we'd optimaly have an API endpoint for it
            // or we grab the current task from our local state 'tasks'
            const currentTask = tasks.find(t => t.id === taskId);
            const currentAssignments = currentTask?.assignedTo || [];

            if (action === 'reassign') {
                updates.assignedTo = [newColleagueId];
            } else if (action === 'add') {
                updates.assignedTo = [...new Set([...currentAssignments, newColleagueId])];
            }

            await apiClient.patch(`/tasks/${taskId}`, updates);
            refetchTasks();
        } catch (err) {
            console.error("Error handling assignment action:", err);
        } finally {
            setPendingReassignment(null);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6 overflow-hidden select-none">
            <header className="flex items-center justify-between gap-8">
                <div className="shrink-0">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Timeline Directory</h2>
                    <p className="text-slate-500 mt-1 text-lg">Drag tasks to reschedule and reassign.</p>
                </div>

                <div className="flex-1 flex justify-center">
                    <TimelineFilters
                        filterText={filterText}
                        setFilterText={setFilterText}
                    />
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        {[
                            { id: '1w', label: '1 Week' },
                            { id: '3w', label: '3 Weeks' },
                            { id: '5w', label: '5 Weeks' }
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => handleScaleChange(s.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${scale === s.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <button onClick={handleToday} className="flex items-center gap-2 px-6 py-3 bg-teal-100 border border-teal-200 rounded-2xl text-sm font-black text-teal-900 hover:bg-teal-200 transition-all shadow-sm group">
                        <Calendar size={18} className="text-teal-600 group-hover:scale-110 transition-transform" />
                        TODAY
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="flex-1 overflow-auto invisible-scrollbar relative cursor-grab active:cursor-grabbing"
                >
                    <div className="flex sticky top-0 z-[10000] bg-white/80 backdrop-blur-md border-b border-slate-200 min-w-max">
                        <div className="sticky left-0 z-[9999] p-6 bg-slate-50/95 border-r border-slate-300 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center shrink-0" style={{ width: '200px' }}>
                            Colleagues
                        </div>
                        <div className="flex">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    style={{ width: getColumnWidth(day), minWidth: getColumnWidth(day) }}
                                    className={`flex flex-col items-center justify-center py-4 border-r border-slate-300 last:border-0 relative shrink-0 ${isToday(day) ? 'bg-teal-100/70' : isWeekend(day) ? 'bg-slate-200/70' : ''}`}
                                >
                                    {day.getDate() === 1 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500 z-50 pointer-events-none" />
                                    )}
                                    {day.getDay() === 1 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/60 z-40 pointer-events-none" />
                                    )}
                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <p className={`text-base font-black mt-0.5 ${isToday(day) ? 'text-teal-950' : 'text-slate-900'}`}>
                                        {day.getDate()}
                                    </p>
                                    {scale === '1w' && (
                                        <p className={`text-[8px] font-bold opacity-40 uppercase tracking-widest ${isToday(day) ? 'text-teal-800' : 'text-slate-500'}`}>
                                            {day.toLocaleDateString('en-US', { month: 'short' })}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col min-w-max">
                        {visibleColleagues.map((colleague, cIdx) => (
                            <TimelineRow
                                key={colleague.id}
                                colleague={colleague}
                                colleagueIndex={cIdx}
                                isDragDisabled={isFiltering}
                                onColleagueDragStart={(e) => handleColleagueDragStart(colleague, cIdx, e)}
                                isDraggingThis={draggingColleague?.colleague.id === colleague.id}
                                // Pass other props
                                colleagues={visibleColleagues}
                                days={days}
                                getColumnWidth={getColumnWidth}
                                isToday={isToday}
                                isWeekend={isWeekend}
                                getTasksForColleague={getTasksForColleague}
                                onUpdate={handleUpdateTask}
                                setScrollDirection={setScrollDirection}
                                scrollContainerRef={scrollContainerRef}
                                draggingTask={draggingTask}
                                setDraggingTask={setDraggingTask}
                                ghostRef={ghostRef}
                                onReassign={handleReassignRequest}
                                safeDate={safeDate}
                                scale={scale}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating dragged task */}
            {draggingTask && (
                <div
                    ref={ghostRef}
                    style={{
                        position: 'fixed',
                        left: Math.max(200, draggingTask.x - (draggingTask.offsetX || 0)),
                        top: draggingTask.y - (draggingTask.offsetY || 0),
                        transform: 'none',
                        pointerEvents: 'none',
                        zIndex: 5000,
                        width: draggingTask.width || 160,
                        height: 97,
                        willChange: 'transform'
                    }}
                    className={`p-3 rounded-xl border border-slate-900 ${getTaskCardColor(draggingTask.task)}`}
                >
                    <div className="flex flex-col gap-2 min-h-[72px]">
                        <div className="flex items-center gap-1.5 font-black text-[8px] uppercase tracking-[0.1em]">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                            {draggingTask.task.priority || 'Task'}
                        </div>
                        <h4 className="font-black text-slate-900 text-[10px] leading-tight uppercase tracking-tight line-clamp-2">{draggingTask.task.title}</h4>
                    </div>
                </div>
            )}

            {/* Floating dragged colleague */}
            {draggingColleague && (
                <div
                    ref={colleagueGhostRef}
                    style={{
                        position: 'fixed',
                        left: draggingColleague.x - draggingColleague.offsetX,
                        top: draggingColleague.y - draggingColleague.offsetY,
                        width: '200px',
                        height: '160px',
                        pointerEvents: 'none',
                        zIndex: 10001,
                        opacity: 0.8
                    }}
                    className="bg-white border-2 border-teal-500 shadow-2xl"
                >
                    <div className="w-full p-4 bg-slate-50 border-r border-slate-300 flex items-center gap-3 h-full">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shrink-0">
                            {draggingColleague.colleague.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-0 mb-1">
                                <p className="font-bold text-slate-900 text-[11px] truncate uppercase tracking-tight leading-tight">
                                    {draggingColleague.colleague.name.split(' ')[0]}
                                </p>
                                <p className="font-bold text-slate-900 text-[11px] truncate uppercase tracking-tight leading-tight">
                                    {draggingColleague.colleague.name.split(' ').slice(1).join(' ')}
                                </p>
                            </div>
                            <div className="flex flex-col gap-0">
                                {draggingColleague.colleague.company && <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{draggingColleague.colleague.company}</p>}
                                {draggingColleague.colleague.department && <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{draggingColleague.colleague.department}</p>}
                                {draggingColleague.colleague.role && <p className="text-[8px] font-bold text-teal-600 uppercase tracking-wider truncate leading-tight">{draggingColleague.colleague.role}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AssignmentConflictModal
                isOpen={!!pendingReassignment}
                onClose={() => setPendingReassignment(null)}
                onReassign={() => handleAssignmentAction('reassign')}
                onAdd={() => handleAssignmentAction('add')}
                colleagueName={pendingReassignment?.colleagueName}
            />
        </div>
    );
};


export default TimelineView;