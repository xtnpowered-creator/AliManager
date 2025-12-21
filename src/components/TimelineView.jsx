import React, { useRef, useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../api/client';
import { Clock, Calendar, GripVertical, User, UserPlus, CalendarDays, Eye, CheckCircle2, RotateCw, RotateCcw, Trash2, Plus, Play, Pause, Square, Maximize2, Flag, Zap, Ban, Shield } from 'lucide-react';
import TimelineRow from './TimelineRow';
import TimelineFilters from './TimelineFilters';
import ContextMenu from './ContextMenu';
import { useAuth } from '../context/AuthContext';
import { useTimelineState } from '../hooks/useTimelineState';
import { useTimelineSelection } from '../hooks/useTimelineSelection';
import TimelineModals from './TimelineModals';
import TimelineSkeleton from './TimelineSkeleton';
import { useToast } from '../context/ToastContext';

// Helper to safely parse any date-like input into a Date object
const safeDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
};

const TimelineView = ({ highlightTaskId, pushView }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const scrollContainerRef = useRef(null);
    const selectionBoxRef = useRef(null); // DIRECT DOM REF

    // -- State Hooks --
    const {
        tasks, refetchTasks, colleagues, projectsData,
        filterText, setFilterText,
        visibleColleagues, filteredTasks,
        delegationMap, handleRevokeDelegation,
        handleUpdateTask, handleBulkUpdate, handleMoveDate, handleDeleteTasks,
        getTasksForColleague, setDelegations,
        loading
    } = useTimelineState(user);

    const {
        selectedTaskIds, setSelectedTaskIds, isSelecting,
        handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, handleLostPointerCapture,
        clearSelection
    } = useTimelineSelection(scrollContainerRef, selectionBoxRef);

    // -- Component State --
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [scale, setScale] = useState(10); // Days visibles per screen (approx)
    const [contextMenu, setContextMenu] = useState(null);

    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [newTaskDefaults, setNewTaskDefaults] = useState({});
    const [showGoToDate, setShowGoToDate] = useState(false);
    const [showCustomScale, setShowCustomScale] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [showMoveDateModal, setShowMoveDateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); // NEW: Custom Delete Modal
    const [flagDate, setFlagDate] = useState(null);

    // Action Modals State
    const [reassignTask, setReassignTask] = useState(null);
    const [rescheduleTask, setRescheduleTask] = useState(null);
    const [inviteTask, setInviteTask] = useState(null);
    const [delegationUser, setDelegationUser] = useState(null);

    // Single Click: Toggle Inline Expansion OR Multi-Select (with Ctrl/Cmd)
    const handleTaskClick = useCallback((task, e) => {
        if (e && (e.ctrlKey || e.metaKey)) {
            setSelectedTaskIds(prev => {
                const next = new Set(prev);
                if (next.has(task.id)) next.delete(task.id);
                else next.add(task.id);
                return next;
            });
        } else {
            setExpandedTaskId(prev => (prev === task.id ? null : task.id));
            setSelectedTaskIds(new Set([task.id]));
        }
    }, [setSelectedTaskIds]);

    // Double Click: Navigate to Full Details Page
    const handleTaskDoubleClick = useCallback((task) => {
        if (pushView) pushView('task-detail', { taskId: task.id });
    }, [pushView]);

    // Deep Link Scroll & Auto-Expand
    useEffect(() => {
        if (highlightTaskId && tasks.length > 0) {
            setExpandedTaskId(highlightTaskId);
            const targetTask = tasks.find(t => t.id === highlightTaskId);
            if (targetTask && targetTask.dueDate) {
                const date = safeDate(targetTask.dueDate);
                if (date) scrollToDate(date, true);
            }
        }
    }, [highlightTaskId, tasks]);


    const handleContextMenu = useCallback((e, type, data) => {
        e.preventDefault();
        if (type === 'task' && !selectedTaskIds.has(data.id)) {
            setSelectedTaskIds(new Set([data.id]));
        }
        setContextMenu({ x: e.clientX, y: e.clientY, type, data });
    }, [selectedTaskIds, setSelectedTaskIds]);

    // Stable Handlers for Child Components
    const onTaskContextMenu = useCallback((e, task) => handleContextMenu(e, 'task', task), [handleContextMenu]);
    const onGridContextMenu = useCallback((date, collId, e) => handleContextMenu(e, 'grid', { date, colleagueId: collId }), [handleContextMenu]);


    // Global Key Handlers (Escape and Shift Tracking)
    const [isShiftKey, setIsShiftKey] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') setIsShiftKey(true);
            if (e.key === 'Escape') {
                setContextMenu(null); setShowNewTaskModal(false);
                setReassignTask(null); setRescheduleTask(null); setInviteTask(null);
                setShowMoveDateModal(false); setShowGoToDate(false); setShowCustomScale(false); setShowFlagModal(false);
                setExpandedTaskId(null); setSelectedTaskIds(new Set());
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Shift') setIsShiftKey(false);
        };

        const handleBlur = () => {
            setIsShiftKey(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);


    // Calculate Days (STATIC 90 DAYS - Performance Balanced)
    const days = useMemo(() => {
        const result = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 30); // 30 days back
        for (let i = 0; i < 90; i++) { // 3 months total
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            result.push(date);
        }
        return result;
    }, []);

    // STABILIZATION: Proxy potentially unstable hook functions to permanent refs
    // This prevents TimelineRow list from regenerating when useTimelineState returns new references
    const getTasksRef = useRef(getTasksForColleague);
    const updateTaskRef = useRef(handleUpdateTask);
    const taskClickRef = useRef(handleTaskClick);
    const taskDoubleRef = useRef(handleTaskDoubleClick);

    useEffect(() => {
        getTasksRef.current = getTasksForColleague;
        updateTaskRef.current = handleUpdateTask;
        taskClickRef.current = handleTaskClick;
        taskDoubleRef.current = handleTaskDoubleClick;
    });

    const stableGetTasks = useCallback((...args) => getTasksRef.current(...args), []);
    const stableUpdateTask = useCallback((...args) => updateTaskRef.current(...args), []);
    const stableTaskClick = useCallback((...args) => taskClickRef.current(...args), []);
    const stableTaskDouble = useCallback((...args) => taskDoubleRef.current(...args), []);

    const getColumnWidth = useCallback((date) => {
        if (!date) return 20;
        const containerW = scrollContainerRef.current?.clientWidth || window.innerWidth;
        const availableW = containerW - 200;
        const avgWidth = availableW / scale;
        const baseUnit = avgWidth * (7 / 6);
        return Math.max([0, 6].includes(date.getDay()) ? baseUnit * 0.5 : baseUnit, 20);
    }, [scale]);

    const isWeekend = useCallback((date) => [0, 6].includes(date.getDay()), []);
    const isToday = useCallback((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
    }, []);


    const scrollToDate = (date, smooth = true) => {
        if (!scrollContainerRef.current) return;
        let offset = 0;
        for (const day of days) {
            if (day.getTime() === date.getTime()) break;
            offset += getColumnWidth(day);
        }
        scrollContainerRef.current.scrollTo({ left: offset - 260, behavior: smooth ? 'smooth' : 'auto' });
    };

    const handleScaleChange = (newScale) => {
        if (scrollContainerRef.current) {
            const scrollLeft = scrollContainerRef.current.scrollLeft;
            const anchor = scrollLeft + 260;
            let current = 0;
            let centerDate = days[0];
            for (const day of days) {
                const width = getColumnWidth(day);
                if (anchor >= current && anchor < current + width) { centerDate = day; break; }
                current += width;
            }
            preserveDateRef.current = centerDate;
        }
        setScale(newScale);
    };

    const preserveDateRef = useRef(null);
    const hasInitialScrolledRef = useRef(false);

    useLayoutEffect(() => {
        if (loading) return;

        // Handle scale change preservation
        if (preserveDateRef.current) {
            scrollToDate(preserveDateRef.current, false);
            preserveDateRef.current = null;
            return;
        }

        // Handle only the VERY FIRST load
        if (!hasInitialScrolledRef.current) {
            scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)), false);
            hasInitialScrolledRef.current = true;
        }
    }, [scale, loading]);


    const isAnySelectedTaskDone = useMemo(() => Array.from(selectedTaskIds).some(id => tasks.find(item => item.id === id)?.status === 'done'), [selectedTaskIds, tasks]);

    const timelineRows = useMemo(() => (
        <div className="flex flex-col min-w-max">
            {visibleColleagues.map((colleague, cIdx) => (
                <div key={colleague.id} className={cIdx === 0 ? "sticky top-[73px] z-[150] shadow-xl border-y-2 border-slate-900 bg-white" : "border-b border-slate-200 last:border-0"}>
                    <TimelineRow
                        colleague={colleague}
                        colleagueIndex={cIdx}
                        colleagues={visibleColleagues}
                        days={days}
                        getColumnWidth={getColumnWidth}
                        isToday={isToday}
                        isWeekend={isWeekend}
                        getTasksForColleague={stableGetTasks}
                        onUpdate={stableUpdateTask}
                        onTaskClick={stableTaskClick}
                        onTaskDoubleClick={stableTaskDouble}
                        onTaskContextMenu={onTaskContextMenu}
                        onGridContextMenu={onGridContextMenu}
                        safeDate={safeDate}
                        scale={scale}
                        expandedTaskId={expandedTaskId}
                        selectedTaskIds={selectedTaskIds}
                        // FORCE UPDATE: Pass the tasks array reference itself.
                        // Since refetch returns a new array, this guarantees update on data change.
                        dataSignature={tasks}
                    />
                </div>
            ))}
        </div>
    ), [visibleColleagues, days, getColumnWidth, isToday, isWeekend, stableGetTasks, stableUpdateTask, stableTaskClick, stableTaskDouble, onTaskContextMenu, onGridContextMenu, scale, expandedTaskId, selectedTaskIds]);

    // Initial Load Only - Show Skeleton if we have no data yet
    if (loading && (!tasks || tasks.length === 0)) return <TimelineSkeleton />;

    return (
        <div className="p-8 h-full flex flex-col space-y-6 overflow-hidden select-none">
            <header className="flex items-center justify-between gap-8 relative">
                <div className="shrink-0">
                    {user?.isDelegated && (
                        <div className="absolute -top-12 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 shadow-sm animate-in slide-in-from-top-2 fade-in">
                            <Shield size={14} className="text-amber-600" />
                            <span>You are acting as a Temporary Admin. Access expires on {new Date(user.delegationExpiresAt).toLocaleDateString()}.</span>
                        </div>
                    )}
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Timeline Directory</h2>
                    <p className="text-slate-500 mt-1 text-lg">Manage assignments and schedules.</p>
                </div>
                <div className="flex-1 flex justify-center">
                    <TimelineFilters filterText={filterText} setFilterText={setFilterText} />
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={() => scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)), true)} className="flex items-center gap-2 px-6 py-3 bg-teal-100 border border-teal-200 rounded-2xl text-sm font-black text-teal-900 hover:bg-teal-200 transition-all shadow-sm group">
                        <Calendar size={18} className="text-teal-600 group-hover:scale-110 transition-transform" />
                        TODAY
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                <div
                    ref={scrollContainerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel} // Safety Cleanup
                    onLostPointerCapture={handleLostPointerCapture} // Safety Cleanup
                    onPointerLeave={handlePointerUp}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Support "Background Click" for bulk actions if tasks are selected
                        if (selectedTaskIds.size > 0) {
                            const firstId = Array.from(selectedTaskIds)[0];
                            const task = tasks.find(t => t.id === firstId);
                            if (task) handleContextMenu(e, 'task', task);
                        }
                    }}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                    className={`flex-1 overflow-auto invisible-scrollbar relative cursor-grab active:cursor-grabbing ${isShiftKey ? '!cursor-crosshair' : ''}`}
                >
                    {/* DEBUG SELECTION BOX */}
                    {/* {selectionRect && console.log('Render Rect:', selectionRect)} */}

                    <div className="flex sticky top-0 z-[200] bg-white/80 backdrop-blur-md border-b border-slate-200 min-w-max h-[73px]">
                        <div className="sticky left-0 z-[205] p-6 bg-slate-50/95 border-r border-slate-300 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center shrink-0" style={{ width: '200px' }}>Colleagues</div>
                        <div className="flex">
                            {days.map((day, i) => (
                                <div key={i}
                                    style={{ width: getColumnWidth(day), minWidth: getColumnWidth(day) }}
                                    onContextMenu={(e) => handleContextMenu(e, 'header', { date: day })}
                                    className={`flex flex-col items-center justify-center py-1 border-r border-slate-300 last:border-0 relative shrink-0 ${isToday(day) ? 'bg-teal-100/70' : isWeekend(day) ? 'bg-slate-200/70' : ''}`}
                                >
                                    {day.getDate() === 1 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500 z-50 pointer-events-none" />}
                                    {day.getDay() === 1 && <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/60 z-40 pointer-events-none" />}
                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className={`text-base font-black mt-0.5 mb-0.5 ${isToday(day) ? 'text-teal-950' : 'text-slate-900'}`}>{day.getDate()}</p>
                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { month: 'short' })}</p>
                                    <p className={`text-[9px] font-black text-slate-500 uppercase tracking-tight leading-none mt-0.5 ${day.getFullYear() === new Date().getFullYear() ? 'invisible' : ''}`}>'{day.getFullYear().toString().slice(-2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {timelineRows}

                    {/* Direct DOM Selection Box (High Performance) */}
                    <div ref={selectionBoxRef} style={{
                        display: isSelecting ? 'block' : 'none',
                        position: 'absolute',
                        left: 0, top: 0, width: 0, height: 0, // Init
                        backgroundColor: 'rgba(20, 184, 166, 0.1)', // Subtle teal
                        border: '1px solid #14b8a6', // 1px border
                        boxShadow: 'none',
                        zIndex: 99999,
                        pointerEvents: 'none',
                        borderRadius: '4px',
                        transform: 'translateZ(9999px)',
                        willChange: 'left, top, width, height'
                    }} />
                </div>
            </div>

            {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}
                    items={contextMenu.type === 'task' ? [
                        { label: 'View Details', icon: Eye, onClick: () => { if (pushView) pushView('task-detail', { taskId: contextMenu.data.id }); setContextMenu(null); } },
                        { type: 'separator' },
                        { label: `Change Due Date...${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: CalendarDays, disabled: isAnySelectedTaskDone, onClick: () => { setRescheduleTask(contextMenu.data); setContextMenu(null); } },
                        { label: `Move Due Date X days...${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Clock, disabled: isAnySelectedTaskDone, onClick: () => { setShowMoveDateModal(true); setContextMenu(null); } },
                        { label: `Reassign...${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: User, disabled: isAnySelectedTaskDone, onClick: () => { setReassignTask(contextMenu.data); setContextMenu(null); } },
                        { label: `Add Collab Assignment...${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: UserPlus, onClick: () => { setInviteTask(contextMenu.data); setContextMenu(null); } },
                        { type: 'separator' },
                        ...((contextMenu.data.isOwner || user?.role === 'god') ? [{
                            label: `Set Priority${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Zap,
                            submenu: [
                                { label: '1 - NOW!', icon: () => <div className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">1</div>, onClick: () => { handleBulkUpdate(selectedTaskIds, { priority: '1' }); setContextMenu(null); } },
                                { label: '2 - ASAP', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">2</div>, onClick: () => { handleBulkUpdate(selectedTaskIds, { priority: '2' }); setContextMenu(null); } },
                                { label: '3 - Soon', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">3</div>, onClick: () => { handleBulkUpdate(selectedTaskIds, { priority: '3' }); setContextMenu(null); } },
                                { label: '4 - Later', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">4</div>, onClick: () => { handleBulkUpdate(selectedTaskIds, { priority: '4' }); setContextMenu(null); } },
                                { label: 'None', icon: Ban, onClick: () => { handleBulkUpdate(selectedTaskIds, { priority: null }); setContextMenu(null); } }
                            ]
                        }] : []),
                        { type: 'separator' },
                        { label: `Mark Doing${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Play, onClick: () => { handleBulkUpdate(selectedTaskIds, { status: 'doing' }); setContextMenu(null); } },
                        { label: `Mark Paused${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Pause, onClick: () => { handleBulkUpdate(selectedTaskIds, { status: 'paused' }); setContextMenu(null); } },
                        { label: `Mark Done${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: CheckCircle2, onClick: () => { handleBulkUpdate(selectedTaskIds, { status: 'done' }); setContextMenu(null); } },
                        { label: `Mark Pending${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Square, onClick: () => { handleBulkUpdate(selectedTaskIds, { status: 'todo' }); setContextMenu(null); } },
                        {
                            label: `Delete Task${selectedTaskIds.size > 1 ? `s (${selectedTaskIds.size})` : ''}`, icon: Trash2, danger: true, onClick: () => {
                                setShowDeleteModal(true);
                                setContextMenu(null);
                            }
                        }
                    ] : contextMenu.type === 'header' ? [
                        { label: 'Go to date...', icon: Calendar, onClick: () => { setShowGoToDate(true); setContextMenu(null); } },
                        { label: 'Set Custom Scale...', icon: Maximize2, onClick: () => { setShowCustomScale(true); setContextMenu(null); } },
                        ...(scale !== 10 ? [{ label: 'Return to default scale', icon: RotateCcw, onClick: () => { handleScaleChange(10); setContextMenu(null); } }] : []),
                        { label: 'Set Custom Flag...', icon: Flag, onClick: () => { setFlagDate(contextMenu.data.date); setShowFlagModal(true); setContextMenu(null); } }
                    ] : contextMenu.type === 'colleague' ? [
                        ...(contextMenu.data.id === (user?.id || user?.uid) ? [] : [
                            ...((user?.role === 'admin' || user?.role === 'god') ? [
                                ...(delegationMap.has(contextMenu.data.id) ? [{ label: 'Revoke Admin Access', icon: Ban, danger: true, onClick: () => { handleRevokeDelegation(delegationMap.get(contextMenu.data.id).id); setContextMenu(null); } }] : [{ label: 'Delegate Admin Access...', icon: Shield, onClick: () => { setDelegationUser(contextMenu.data); setContextMenu(null); } }]),
                                { type: 'separator' }
                            ] : []),
                            { label: 'View Profile', icon: Eye, onClick: () => { if (pushView) pushView('user-profile', { userId: contextMenu.data.id }); setContextMenu(null); } }
                        ])
                    ] : [
                        { label: 'Create Task Here...', icon: Plus, onClick: () => { setNewTaskDefaults({ dueDate: contextMenu.data.date, assigneeId: contextMenu.data.colleagueId }); setShowNewTaskModal(true); setContextMenu(null); } }
                    ]}
                />
            )}

            <TimelineModals
                tasks={tasks}
                selectedTaskIds={selectedTaskIds}
                setSelectedTaskIds={setSelectedTaskIds}
                refetchTasks={refetchTasks}
                scrollToDate={scrollToDate}
                handleScaleChange={handleScaleChange}
                reassignTask={reassignTask} setReassignTask={setReassignTask}
                rescheduleTask={rescheduleTask} setRescheduleTask={setRescheduleTask}
                inviteTask={inviteTask} setInviteTask={setInviteTask}
                showMoveDateModal={showMoveDateModal} setShowMoveDateModal={setShowMoveDateModal}
                showNewTaskModal={showNewTaskModal} setShowNewTaskModal={setShowNewTaskModal}
                newTaskDefaults={newTaskDefaults}
                showGoToDate={showGoToDate} setShowGoToDate={setShowGoToDate}
                showCustomScale={showCustomScale} setShowCustomScale={setShowCustomScale}
                showFlagModal={showFlagModal} setShowFlagModal={setShowFlagModal}
                flagDate={flagDate}
                delegationUser={delegationUser} setDelegationUser={setDelegationUser}
                setDelegations={setDelegations}
                // Delete Modal Props
                showDeleteModal={showDeleteModal}
                setShowDeleteModal={setShowDeleteModal}
                handleDeleteTasks={handleDeleteTasks}
                handleMoveDate={handleMoveDate}
                handleBulkUpdate={handleBulkUpdate} // NEW
            />
        </div>
    );
};

export default TimelineView;