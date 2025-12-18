import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { useCollection } from '../hooks/useCollection';
import { Clock, Calendar, GripVertical } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import AssignmentConflictModal from './AssignmentConflictModal';
import { addScrollTestData } from '../utils/addTestData';
import TimelineRow from './TimelineRow';
import TimelineFilters from './TimelineFilters';

const TimelineView = () => {
    const { data: tasks } = useCollection('tasks', 'dueDate');
    const { data: colleagues } = useCollection('colleagues');
    const { data: projectsData } = useCollection('projects');

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
    const scrollInterval = useRef(null);

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
        const baseWidth = scale === '1w' ? 240 : scale === '3w' ? 90 : 60;
        return isWeekend(date) ? baseWidth * 0.7 : baseWidth;
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

    const getTasksForDay = (colleagueId, date) => {
        const dateStr = date.toISOString().split('T')[0];
        // Use filteredTasks here to hide irrelevant tasks
        return filteredTasks.filter(t => t.assignedTo?.includes(colleagueId) && t.dueDate.split('T')[0] === dateStr);
    };

    const handleToday = () => {
        const todayIdx = days.findIndex(d => isToday(d));
        if (todayIdx !== -1 && scrollContainerRef.current) {
            // Calculate total width up to today
            const widthBeforeToday = days.slice(0, todayIdx).reduce((acc, day) => acc + getColumnWidth(day), 0);
            scrollContainerRef.current.scrollTo({ left: widthBeforeToday - 100, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        setTimeout(handleToday, 100);
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

    const handleUpdateTask = async (taskId, newDate, newColleagueId) => {
        try {
            const taskRef = doc(db, 'tasks', taskId);
            const updates = {};
            if (newDate) updates.dueDate = newDate.toISOString();
            if (newColleagueId) updates.assignedTo = [newColleagueId]; // Default behavior (drag within same colleague or date change)
            await updateDoc(taskRef, updates);
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
            const taskRef = doc(db, 'tasks', taskId);
            const updates = {};

            if (newDate) updates.dueDate = newDate.toISOString();

            if (action === 'reassign') {
                // Remove from old (implicit by setting new array), replace with new
                updates.assignedTo = [newColleagueId];
            } else if (action === 'add') {
                // Add new colleague to existing array
                updates.assignedTo = arrayUnion(newColleagueId);
            }

            await updateDoc(taskRef, updates);
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
                                onClick={() => setScale(s.id)}
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
                    <div className="flex sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 min-w-max">
                        <div className="sticky left-0 z-40 w-56 p-6 bg-slate-50/95 border-r border-slate-200 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center shrink-0">
                            Personnel
                        </div>
                        <div className="flex">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    style={{ width: getColumnWidth(day), minWidth: getColumnWidth(day) }}
                                    className={`flex flex-col items-center justify-center py-4 border-r border-slate-200 last:border-0 relative shrink-0 ${isToday(day) ? 'bg-teal-100/70' : isWeekend(day) ? 'bg-slate-200/70' : ''}`}
                                >
                                    {day.getDate() === 1 && i > 0 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)] z-50" />
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

                    <Reorder.Group axis="y" values={visibleColleagues} onReorder={handleReorder} className="flex flex-col min-w-max">
                        {visibleColleagues.map((colleague, cIdx) => (
                            <TimelineRowWrapper
                                key={colleague.id}
                                colleague={colleague}
                                cIdx={cIdx}
                                isDragDisabled={isFiltering}
                                // Pass other props
                                colleagues={colleagues}
                                days={days}
                                getColumnWidth={getColumnWidth}
                                isToday={isToday}
                                isWeekend={isWeekend}
                                getTasksForDay={getTasksForDay}
                                onUpdate={handleUpdateTask}
                                setScrollDirection={setScrollDirection}
                                scrollContainerRef={scrollContainerRef}
                                draggingTask={draggingTask}
                                setDraggingTask={setDraggingTask}
                                ghostRef={ghostRef}
                                onReassign={handleReassignRequest}
                            />
                        ))}
                    </Reorder.Group>
                </div>
            </div>

            {/* Floating dragged task */}
            {draggingTask && (
                <div
                    ref={ghostRef}
                    style={{
                        position: 'fixed',
                        left: draggingTask.x - (draggingTask.offsetX || 0),
                        top: draggingTask.y - (draggingTask.offsetY || 0),
                        transform: 'none',
                        pointerEvents: 'none',
                        zIndex: 10000,
                        scale: 1.1,
                        willChange: 'transform'
                    }}
                    className={`p-3 rounded-xl border-[2.5px] border-slate-900 shadow-[8px_8px_0_0_rgba(0,0,0,1)] w-[160px] ${draggingTask.task.priority === 'high' ? 'bg-amber-100' :
                        draggingTask.task.priority === 'medium' ? 'bg-blue-100' : 'bg-teal-100'
                        }`}
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 font-black text-[8px] uppercase tracking-[0.1em]">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                            {draggingTask.task.priority || 'Task'}
                        </div>
                        <h4 className="font-black text-slate-900 text-[10px] leading-tight uppercase tracking-tight line-clamp-2">{draggingTask.task.title}</h4>
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

const TimelineRowWrapper = ({ colleague, cIdx, ...props }) => {
    const controls = useDragControls();
    return (
        <Reorder.Item value={colleague} dragListener={false} dragControls={controls}>
            <TimelineRow colleague={colleague} colleagueIndex={cIdx} dragControls={controls} {...props} />
        </Reorder.Item>
    );
};