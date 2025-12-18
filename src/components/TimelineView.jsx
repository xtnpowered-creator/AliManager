import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCollection } from '../hooks/useCollection';
import { Clock, Calendar, GripVertical } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import AssignmentConflictModal from './AssignmentConflictModal';
import { addScrollTestData } from '../utils/addTestData';

const TimelineView = () => {
    const { data: tasks } = useCollection('tasks', 'dueDate');
    const { data: colleagues } = useCollection('colleagues');

    const [scale, setScale] = useState('week');
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
        start.setDate(start.getDate() - 90);
        for (let i = 0; i < 180; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            result.push(date);
        }
        return result;
    }, []);

    const columnWidth = useMemo(() => {
        if (scale === 'day') return 400;
        if (scale === 'week') return 200;
        return 80;
    }, [scale]);

    const isWeekend = (date) => [0, 6].includes(date.getDay());
    const isToday = (date) => date.toDateString() === new Date().toDateString();

    const getTasksForDay = (colleagueId, date) => {
        const dateStr = date.toISOString().split('T')[0];
        return tasks.filter(t => t.assignedTo?.includes(colleagueId) && t.dueDate.split('T')[0] === dateStr);
    };

    const handleToday = () => {
        const todayIdx = days.findIndex(d => isToday(d));
        if (todayIdx !== -1 && scrollContainerRef.current) {
            const left = todayIdx * columnWidth - 100;
            scrollContainerRef.current.scrollTo({ left, behavior: 'smooth' });
        }
    };

    useEffect(() => { setTimeout(handleToday, 100); }, [columnWidth]);

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
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Timeline Directory</h2>
                    <p className="text-slate-500 mt-1 text-lg">Drag tasks to reschedule and reassign.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        {['day', 'week', 'month'].map((s) => (
                            <button key={s} onClick={() => setScale(s)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${scale === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <button onClick={addScrollTestData} className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-200 transition-colors">
                        SEED TEST DATA
                    </button>
                    <button onClick={handleToday} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-800 hover:bg-slate-50 transition-all shadow-sm group">
                        <Calendar size={18} className="text-teal-500 group-hover:scale-110 transition-transform" />
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
                                <div key={i} style={{ minWidth: columnWidth }} className={`p-6 text-center border-r border-slate-200 last:border-0 ${isToday(day) ? 'bg-teal-100/70' : isWeekend(day) ? 'bg-slate-200/70' : ''}`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className={`text-lg font-black mt-1 ${isToday(day) ? 'text-teal-950' : 'text-slate-900'}`}>{day.getDate()} {day.toLocaleDateString('en-US', { month: 'short' })}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col min-w-max">
                        {colleagues.map((colleague, cIdx) => (
                            <div key={colleague.id} className="flex border-b border-slate-200 group hover:bg-slate-50/30 transition-colors last:border-0 h-48 relative">
                                <div className="sticky left-0 z-20 w-56 p-6 bg-white border-r border-slate-200 flex items-center gap-4 shrink-0 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)]">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shadow-slate-200">{colleague.avatar}</div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">{colleague.name}</p>
                                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest truncate">{colleague.role}</p>
                                    </div>
                                </div>
                                <div className="flex relative shrink-0">
                                    <div className="absolute top-1/2 left-0 w-full h-[4px] bg-slate-400/50 -translate-y-1/2 z-0" />
                                    {days.map((day, dIdx) => (
                                        <div key={dIdx} style={{ minWidth: columnWidth }} className={`h-full border-r border-slate-200/50 flex items-center justify-center relative last:border-0 ${isToday(day) ? 'bg-teal-100/40' : isWeekend(day) ? 'bg-slate-200/40' : ''}`}>
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
                                                        colleagueIndex={cIdx}
                                                        columnWidth={columnWidth}
                                                        onUpdate={handleUpdateTask}
                                                        setScrollDirection={setScrollDirection}
                                                        scrollContainerRef={scrollContainerRef}
                                                        draggingTask={draggingTask}
                                                        setDraggingTask={setDraggingTask}
                                                        ghostRef={ghostRef}
                                                        onReassign={handleReassignRequest}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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

const TaskCard = ({ task, index, currentDate, currentColleagueId, colleagues, colleagueIndex, columnWidth, onUpdate, setScrollDirection, scrollContainerRef, draggingTask, setDraggingTask, ghostRef, onReassign }) => {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    const xOffset = index * 12;
    const yOffset = index * -12;
    const rowHeight = 192;
    const personnelColWidth = 224;

    // Use ref to store drag data so event handlers can access current values
    const dragDataRef = useRef(null);

    const handleMouseDown = (e) => {
        e.stopPropagation();

        // Calculate offset from top-left of card
        const rect = cardRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        dragDataRef.current = {
            taskId: task.id,
            startX: e.clientX,
            startY: e.clientY,
            startScrollLeft: scrollContainerRef.current.scrollLeft,
            startDate: currentDate,
            startColleagueId: currentColleagueId,
            startColleagueIndex: colleagueIndex,
            offsetX,
            offsetY
        };

        setDraggingTask({
            task,
            x: e.clientX,
            y: e.clientY,
            startDate: currentDate,
            startColleagueId: currentColleagueId,
            startColleagueIndex: colleagueIndex,
            offsetX,
            offsetY
        });

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = (e) => {
        // Update ghost position directly via DOM for smooth 60fps movement
        if (ghostRef.current && dragDataRef.current) {
            const { offsetX, offsetY } = dragDataRef.current;
            ghostRef.current.style.left = `${e.clientX - offsetX}px`;
            ghostRef.current.style.top = `${e.clientY - offsetY}px`;
        }

        // Auto-scroll logic
        if (!scrollContainerRef.current) return;
        const rect = scrollContainerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const leftLimit = personnelColWidth + 80;
        const rightLimit = rect.width - 80;

        if (relativeX < leftLimit) {
            setScrollDirection(-1);
        } else if (relativeX > rightLimit) {
            setScrollDirection(1);
        } else {
            setScrollDirection(0);
        }
    };

    const handleGlobalMouseUp = (e) => {
        setScrollDirection(0);
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);

        if (!scrollContainerRef.current || !dragDataRef.current) {
            dragDataRef.current = null;
            setDraggingTask(null);
            return;
        }

        const { taskId, startX, startY, startScrollLeft, startDate, startColleagueId, startColleagueIndex } = dragDataRef.current;
        // Calculate movement
        const totalScrollDelta = scrollContainerRef.current.scrollLeft - startScrollLeft;
        const pointerDeltaX = e.clientX - startX;
        const pointerDeltaY = e.clientY - startY;

        const totalGridDeltaX = pointerDeltaX + totalScrollDelta;

        const dayDelta = Math.round(totalGridDeltaX / columnWidth);
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + dayDelta);

        const colleagueDelta = Math.round(pointerDeltaY / rowHeight);
        let newColleagueId = startColleagueId;
        const newIdx = startColleagueIndex + colleagueDelta;
        if (newIdx >= 0 && newIdx < colleagues.length) {
            newColleagueId = colleagues[newIdx].id;
        }

        dragDataRef.current = null;

        if (newColleagueId !== startColleagueId) {
            // Colleague changed - trigger reassign flow
            onReassign(taskId, newColleagueId, newDate);
            setDraggingTask(null);
        } else if (dayDelta !== 0) {
            // Only date changed - implicit update
            onUpdate(taskId, newDate, null);
            // Keep ghost visible briefly to prevent flash while Firestore updates
            setTimeout(() => setDraggingTask(null), 100);
        } else {
            setDraggingTask(null);
        }
    };

    // Hide if this is the dragged task
    const isDragged = draggingTask?.task.id === task.id;

    return (
        <motion.div
            ref={cardRef}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: isDragged ? 0 : 1,
                scale: 1,
                x: xOffset,
                y: yOffset,
                zIndex: isHovered ? 1000 : 10 + index
            }}
            whileHover={{ scale: 1.05 }}
            className={`absolute pointer-events-auto task-card cursor-grab p-3 rounded-xl border-[2.5px] border-slate-900 shadow-[6px_6px_0_0_rgba(0,0,0,1)] min-w-[140px] max-w-[180px] ${task.priority === 'high' ? 'bg-amber-100' :
                task.priority === 'medium' ? 'bg-blue-100' : 'bg-teal-100'
                } group transition-all`}
        >
            <div className="flex flex-col gap-2 relative">
                <div className="absolute -left-1.5 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={12} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-1.5 font-black text-[8px] uppercase tracking-[0.1em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    {task.priority || 'Task'}
                </div>
                <h4 className="font-black text-slate-900 text-[10px] leading-tight uppercase tracking-tight line-clamp-2">{task.title}</h4>
                <div className="flex items-center justify-between mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-900" />
                        <span className="text-[8px] font-black text-slate-900 uppercase">Deliverable</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TimelineView;
