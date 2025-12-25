import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import ContextMenu from './ContextMenu';
import TimelineModals from './TimelineModals';
import { useSyncedTimelineState } from '../hooks/useSyncedTimelineState';
import { useTimelineSelection } from '../hooks/useTimelineSelection';
import { useTimelineScroll } from '../hooks/useTimelineScroll';
import { getMenuOptions } from './timeline/contextMenuHelpers.jsx';

// Sub-Components
import TimelineHeader from './timeline/TimelineHeader';
import TimelineBody from './timeline/TimelineBody';
import { TIMELINE_LAYOUT } from '../config/layoutConstants';
import HoriScrollTargetPoint from './timeline/HoriScrollTargetPoint';

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
    maxTaskDate,
    onDateScroll // New Callback prop
}) => {
    const navigate = useNavigate();
    const scrollContainerRef = React.useRef(null);
    const selectionBoxRef = React.useRef(null);
    const boardRef = React.useRef(null);

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

    // -- RED TRIANGLE LOGIC --
    const [horiScrollAnchorX, setHoriScrollAnchorX] = React.useState(() => {
        const saved = localStorage.getItem('horiScrollAnchorX');
        return saved ? parseFloat(saved) : TIMELINE_LAYOUT.SCROLL_ANCHOR_X;
    });

    const handleAnchorDrag = React.useCallback((newX) => {
        setHoriScrollAnchorX(newX);
        localStorage.setItem('horiScrollAnchorX', newX);
    }, []);

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

    // Scroll Logic Hook
    const { scrollToDate, scrollToTarget } = useTimelineScroll({
        scrollContainerRef,
        days,
        getColumnWidth,
        viewOffset,
        setInteracted,
        viewOffset,
        setInteracted,
        controlsRef,
        horiScrollAnchorX // Pass dynamic anchor
    });



    const handleScaleChange = (newScale) => setScale(newScale);

    // Header Wheel Logic
    const handleHeaderWheel = React.useCallback((e) => {
        if (e.deltaY !== 0 && scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft += e.deltaY;
        }
    }, []);

    const handleScrollToDate = (d) => {
        scrollToDate(d);
        if (onDateScroll) onDateScroll(d);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden select-none relative">
            {/* Header / Filters */}
            {headerContent && <div className="shrink-0 mb-1.5">{headerContent}</div>}

            <div ref={boardRef} className={`flex-1 bg-white ${showSidebar ? 'rounded-[2.5rem] border border-slate-300' : 'rounded-2xl border border-slate-300'} shadow-sm flex flex-col overflow-hidden relative`}>
                {/* Dynamic Scroll Target (Red Triangle) */}
                <HoriScrollTargetPoint
                    positionX={horiScrollAnchorX}
                    onDrag={handleAnchorDrag}
                    // Left Limit: Sidebar Width + 50px Buffer
                    minX={TIMELINE_LAYOUT.SIDEBAR_WIDTH + 50}
                    containerRef={boardRef}
                    rightBuffer={100} // Increased buffer to avoid border-radius clipping
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
                    {/* MOVED SELECTION BOX INSIDE SCROLL CONTAINER */}
                    <div ref={selectionBoxRef} style={{
                        display: isSelecting ? 'block' : 'none',
                        position: 'absolute',
                        left: 0, top: 0, width: 0, height: 0,
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        border: '1px solid #14b8a6',
                        zIndex: 99999, pointerEvents: 'none', borderRadius: '4px',
                        willChange: 'left, top, width, height'
                    }} />

                    <TimelineHeader
                        days={days}
                        getColumnWidth={getColumnWidth}
                        isToday={isToday}
                        isWeekend={isWeekend}
                        onContextMenu={handleContextMenu}
                        showSidebar={showSidebar}
                        onWheel={handleHeaderWheel}
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
                        getMenuOptions({
                            type: contextMenu.type,
                            data: contextMenu.data,
                            user,
                            delegationMap,
                            callbacks: {
                                closeMenu: () => setContextMenu(null),
                                navigate,
                                setRescheduleTask,
                                setReassignTask,
                                setInviteTask,
                                onBulkUpdate,
                                setShowDeleteModal,
                                setShowGoToDate,
                                setShowCustomScale,
                                handleScaleChange,
                                setFlagDate,
                                setShowFlagModal,
                                handleRevokeDelegation,
                                onDelegateConfig,
                                setNewTaskDefaults,
                                setShowNewTaskModal,
                                setShowMoveDateModal,
                                selectedTaskIds,
                                setSelectedTaskIds,
                                scale
                            }
                        })
                    }
                />
            )}

            <TimelineModals
                tasks={tasks}
                selectedTaskIds={selectedTaskIds}
                setSelectedTaskIds={setSelectedTaskIds}
                refetchTasks={refetchTasks}
                scrollToDate={handleScrollToDate}
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
