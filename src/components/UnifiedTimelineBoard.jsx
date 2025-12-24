import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CalendarDays, Clock, User, UserPlus, Zap, Play, Pause, CheckCircle2, Square, Trash2, Ban, Maximize2, RotateCcw, Flag, Plus, Shield, Calendar } from 'lucide-react';
import ContextMenu from './ContextMenu';
import TimelineModals from './TimelineModals';
import { useSyncedTimelineState } from '../hooks/useSyncedTimelineState';
import { useTimelineSelection } from '../hooks/useTimelineSelection';

// Sub-Components
import TimelineHeader from './timeline/TimelineHeader';
import TimelineBody from './timeline/TimelineBody';
import TimelineOverlay from './timeline/TimelineOverlay';

const UnifiedTimelineBoard = ({
    user,
    colleagues,
    tasks,
    getTasksForColleague,
    days,
    isToday,
    isWeekend,
    scale,
    setScale,
    onUpdateTask,
    onBulkUpdate,
    onDeleteTasks,
    onMoveDate,
    refetchTasks,
    showSidebar = false,
    viewOffset = 0,
    headerContent = null,
    delegationMap = new Map(),
    handleRevokeDelegation = () => { },
    onDelegateConfig = () => { },
    loading = false,
    controlsRef,
    // Indicators
    minTaskDate,
    maxTaskDate
}) => {
    const navigate = useNavigate();
    const scrollContainerRef = React.useRef(null);
    const selectionBoxRef = React.useRef(null);

    // Scroll Arrows State
    const [showLeftArrow, setShowLeftArrow] = React.useState(false);
    const [showRightArrow, setShowRightArrow] = React.useState(false);

    // 1. Column Width
    // 1. Column Width
    // 1. Fixed Column Width (Physical Units)
    // Scale is effectively "Pixels Per Day".
    // Migration: If scale is small (< 30), assume it's the old "Days Count" and default to 96px (1 inch).
    const getColumnWidth = React.useCallback((date, overrideScale) => {
        if (!date) return 20;

        let s = overrideScale || scale || 96;
        if (s < 30) s = 96; // Fallback for legacy "10 days" setting

        const width = s;
        // Weekends 50% width
        return Math.max([0, 6].includes(date.getDay()) ? width * 0.5 : width, 20);
    }, [scale]);

    // 2. Selection & State Hooks
    const {
        selectedTaskIds, setSelectedTaskIds, isSelecting,
        handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, handleLostPointerCapture,
    } = useTimelineSelection(scrollContainerRef, selectionBoxRef);

    const { isRestored, syncedScale, setInteracted } = useSyncedTimelineState(scrollContainerRef, days, getColumnWidth, isToday, scale, viewOffset);

    // 3. UI State
    const [contextMenu, setContextMenu] = React.useState(null);
    const [expandedTaskId, setExpandedTaskId] = React.useState(null);
    const [isShiftKey, setIsShiftKey] = React.useState(false);

    // Modals
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [showMoveDateModal, setShowMoveDateModal] = React.useState(false);
    const [showGoToDate, setShowGoToDate] = React.useState(false);
    const [showCustomScale, setShowCustomScale] = React.useState(false);
    const [showFlagModal, setShowFlagModal] = React.useState(false);
    const [showNewTaskModal, setShowNewTaskModal] = React.useState(false);
    const [flagDate, setFlagDate] = React.useState(null);
    const [newTaskDefaults, setNewTaskDefaults] = React.useState({});
    const [reassignTask, setReassignTask] = React.useState(null);
    const [rescheduleTask, setRescheduleTask] = React.useState(null);
    const [inviteTask, setInviteTask] = React.useState(null);
    const [delegationUser, setDelegationUser] = React.useState(null);

    // 4. Handlers
    const handleContextMenu = React.useCallback((e, type, data) => {
        e.preventDefault(); e.stopPropagation();
        if (type === 'task' && !selectedTaskIds.has(data.id)) {
            setSelectedTaskIds(new Set([data.id]));
        }
        setContextMenu({ x: e.clientX, y: e.clientY, type, data });
    }, [selectedTaskIds, setSelectedTaskIds]);

    const onTaskClick = React.useCallback((task, e) => {
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

    const onTaskDoubleClick = React.useCallback((task) => {
        navigate(`/task/${task.id}`);
    }, [navigate]);

    // Keyboard
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') setIsShiftKey(true);
            if (e.key === 'Escape') {
                setContextMenu(null); setShowNewTaskModal(false);
                setReassignTask(null); setRescheduleTask(null); setInviteTask(null);
                setShowMoveDateModal(false); setShowGoToDate(false); setShowCustomScale(false); setShowFlagModal(false);
                setExpandedTaskId(null); setSelectedTaskIds(new Set());
            }
        };
        const handleKeyUp = (e) => { if (e.key === 'Shift') setIsShiftKey(false); };
        const handleBlur = () => { setIsShiftKey(false); };
        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); window.addEventListener('blur', handleBlur);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('blur', handleBlur); };
    }, [setSelectedTaskIds]);

    // Scroll Logic
    const scrollToTarget = (date, colleagueId, smooth = true) => {
        if (!scrollContainerRef.current) return;
        if (setInteracted) setInteracted();

        // 1. Calculate Left (Date)
        let finalLeft = undefined;
        if (date) {
            const targetTime = new Date(date).setHours(0, 0, 0, 0);
            let offset = 0;

            // Handle out of bounds
            const startDay = days[0].getTime();
            const endDay = days[days.length - 1].getTime();

            if (targetTime < startDay) offset = 0;
            else if (targetTime > endDay) offset = days.reduce((acc, d) => acc + getColumnWidth(d), 0);
            else {
                for (const day of days) {
                    if (day.getTime() === targetTime) break;
                    offset += getColumnWidth(day);
                }
            }
            finalLeft = Math.max(0, offset + viewOffset - 350);
        }

        // 2. Calculate Top (Colleague)
        let finalTop = undefined;
        if (colleagueId) {
            const row = document.getElementById(`timeline-row-${colleagueId}`);
            if (row) {
                finalTop = Math.max(0, row.offsetTop - 180);
            }
        }

        // 3. Execute Unified Scroll
        const scrollOptions = {
            ...(finalLeft !== undefined && { left: finalLeft }),
            ...(finalTop !== undefined && { top: finalTop }),
            behavior: smooth ? 'smooth' : 'auto'
        };

        scrollContainerRef.current.scrollTo(scrollOptions);
    };

    const scrollToDate = (date, smooth = true) => scrollToTarget(date, null, smooth);
    const scrollToColleague = (colleagueId, smooth = true) => scrollToTarget(null, colleagueId, smooth);

    React.useEffect(() => {
        if (controlsRef && controlsRef.current) {
            controlsRef.current.scrollToDate = scrollToDate;
            controlsRef.current.scrollToColleague = scrollToColleague;
            controlsRef.current.scrollToTarget = scrollToTarget;
        }
    }, [controlsRef, days, getColumnWidth]);



    const handleScaleChange = (newScale) => setScale(newScale);

    // 5. Render
    return (
        <div className="flex flex-col h-full overflow-hidden select-none relative">
            {headerContent && <div className="shrink-0 mb-0">{headerContent}</div>}

            <TimelineOverlay
                selectionBoxRef={selectionBoxRef}
                isSelecting={isSelecting}
                showSidebar={showSidebar}
                onTodayClick={() => scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)), true)}
                scale={scale}
            />

            <div className={`flex-1 bg-white ${showSidebar ? 'rounded-[2.5rem] border border-slate-200' : 'rounded-2xl border border-slate-200'} shadow-sm flex flex-col overflow-hidden relative`}>
                {/* Debug Alignment Arrow - 350px Anchor */}
                <div
                    style={{
                        position: 'absolute',
                        left: '350px',
                        top: '0',
                        zIndex: 600,
                        width: 0,
                        height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderTop: '15px solid red',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'none'
                    }}
                />

                <div
                    ref={scrollContainerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    onLostPointerCapture={handleLostPointerCapture}
                    onPointerLeave={handlePointerUp}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                    className={`flex-1 overflow-auto invisible-scrollbar relative cursor-grab active:cursor-grabbing ${isShiftKey ? '!cursor-crosshair' : ''}`}
                >
                    <TimelineHeader
                        days={days}
                        getColumnWidth={getColumnWidth}
                        isToday={isToday}
                        isWeekend={isWeekend}
                        onContextMenu={handleContextMenu}
                        showSidebar={showSidebar}
                    />

                    <TimelineBody
                        colleagues={colleagues}
                        days={days}
                        getColumnWidth={getColumnWidth}
                        isToday={isToday}
                        isWeekend={isWeekend}
                        getTasksForColleague={getTasksForColleague}
                        onUpdateTask={onUpdateTask}
                        onTaskClick={onTaskClick}
                        onTaskDoubleClick={onTaskDoubleClick}
                        onContextMenu={handleContextMenu}
                        scale={scale}
                        expandedTaskId={expandedTaskId}
                        selectedTaskIds={selectedTaskIds}
                        showSidebar={showSidebar}
                        delegationMap={delegationMap}
                        handleRevokeDelegation={handleRevokeDelegation}
                        onDelegateConfig={onDelegateConfig}
                        user={user}
                    />
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}
                    items={/* Flattened or abstracted logic could go here, for now relying on existing massive list but in collapsed state */
                        contextMenu.type === 'task' ? [
                            { label: 'View Details', icon: Eye, onClick: () => { navigate(`/task/${contextMenu.data.id}`); setContextMenu(null); } },
                            { type: 'separator' },
                            { label: 'Change Due Date...', icon: CalendarDays, onClick: () => { setRescheduleTask(contextMenu.data); setContextMenu(null); } },
                            { label: 'Move Due Date X days...', icon: Clock, onClick: () => { setShowMoveDateModal(true); setContextMenu(null); } },
                            { label: 'Reassign...', icon: User, onClick: () => { setReassignTask(contextMenu.data); setContextMenu(null); } },
                            { label: 'Add Collab Assignment...', icon: UserPlus, onClick: () => { setInviteTask(contextMenu.data); setContextMenu(null); } },
                            { type: 'separator' },
                            ...((contextMenu.data.isOwner || user?.role === 'god') ? [{
                                label: 'Set Priority', icon: Zap,
                                submenu: [
                                    { label: '1 - NOW!', icon: () => <div className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">1</div>, onClick: () => { onBulkUpdate(selectedTaskIds, { priority: '1' }); setSelectedTaskIds(new Set()); setContextMenu(null); } },
                                    { label: '2 - ASAP', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">2</div>, onClick: () => { onBulkUpdate(selectedTaskIds, { priority: '2' }); setSelectedTaskIds(new Set()); setContextMenu(null); } },
                                    { label: '3 - Soon', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">3</div>, onClick: () => { onBulkUpdate(selectedTaskIds, { priority: '3' }); setSelectedTaskIds(new Set()); setContextMenu(null); } },
                                    { label: '4 - Later', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">4</div>, onClick: () => { onBulkUpdate(selectedTaskIds, { priority: '4' }); setSelectedTaskIds(new Set()); setContextMenu(null); } },
                                    { label: 'None', icon: Ban, onClick: () => { onBulkUpdate(selectedTaskIds, { priority: null }); setSelectedTaskIds(new Set()); setContextMenu(null); } }
                                ]
                            }] : []),
                            { type: 'separator' },
                            { label: 'Mark Doing', icon: Play, onClick: () => { onBulkUpdate(selectedTaskIds, { status: 'doing' }); setSelectedTaskIds(new Set()); setContextMenu(null); } },
                            { label: 'Mark Paused', icon: Pause, onClick: () => { onBulkUpdate(selectedTaskIds, { status: 'paused' }); setSelectedTaskIds(new Set()); setContextMenu(null); } },
                            { label: 'Mark Done', icon: CheckCircle2, onClick: () => { onBulkUpdate(selectedTaskIds, { status: 'done' }); setSelectedTaskIds(new Set()); setContextMenu(null); } },
                            { label: 'Mark Pending', icon: Square, onClick: () => { onBulkUpdate(selectedTaskIds, { status: 'todo' }); setSelectedTaskIds(new Set()); setContextMenu(null); } },
                            { label: 'Delete Task', icon: Trash2, danger: true, onClick: () => { setShowDeleteModal(true); setContextMenu(null); } }
                        ] : contextMenu.type === 'header' ? [
                            { label: 'Go to date...', icon: Calendar, onClick: () => { setShowGoToDate(true); setContextMenu(null); } },
                            { label: 'Set Custom Scale...', icon: Maximize2, onClick: () => { setShowCustomScale(true); setContextMenu(null); } },
                            ...(scale !== 10 ? [{ label: 'Return to default scale', icon: RotateCcw, onClick: () => { handleScaleChange(10); setContextMenu(null); } }] : []),
                            { label: 'Set Custom Flag...', icon: Flag, onClick: () => { setFlagDate(contextMenu.data.date); setShowFlagModal(true); setContextMenu(null); } }
                        ] : contextMenu.type === 'colleague' ? [
                            ...(contextMenu.data.id === (user?.id || user?.uid) ? [] : [
                                ...((user?.role === 'admin' || user?.role === 'god') ? [
                                    ...(delegationMap.has(contextMenu.data.id) ? [{ label: 'Revoke Admin Access', icon: Ban, danger: true, onClick: () => { handleRevokeDelegation(delegationMap.get(contextMenu.data.id).id); setContextMenu(null); } }] : [{ label: 'Delegate Admin Access...', icon: Shield, onClick: () => { onDelegateConfig(contextMenu.data); setContextMenu(null); } }]),
                                    { type: 'separator' }
                                ] : []),
                                { label: 'View Profile', icon: Eye, onClick: () => { console.warn("Pending"); setContextMenu(null); } }
                            ])
                        ] : [
                            { label: 'Create Task Here...', icon: Plus, onClick: () => { setNewTaskDefaults({ dueDate: contextMenu.data.date, assigneeId: contextMenu.data.colleagueId }); setShowNewTaskModal(true); setContextMenu(null); } }
                        ]
                    }
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
                showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal}
                handleDeleteTasks={onDeleteTasks}
                handleMoveDate={onMoveDate}
                handleBulkUpdate={onBulkUpdate}
                colleagues={colleagues}
            />
        </div>
    );
};

export default UnifiedTimelineBoard;
