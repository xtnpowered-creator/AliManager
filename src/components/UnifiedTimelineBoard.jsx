import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import ContextMenu from './ContextMenu';
import TimelineModals from './TimelineModals';
import { useSyncedTimelineState } from '../hooks/useSyncedTimelineState';
import { useTimelineSelection } from '../hooks/useTimelineSelection';
import { useTimelineScroll } from '../hooks/useTimelineScroll';
import { getMenuOptions } from './timeline/contextMenuHelpers.jsx';

import TimelineHeader from './timeline/TimelineHeader';
import TimelineBody from './timeline/TimelineBody';
import { TIMELINE_LAYOUT } from '../config/layoutConstants';
import HoriScrollTargetPoint from './timeline/HoriScrollTargetPoint';
import { getPixelOffsetFromStart, getDateFromPixelOffset, getDayWidth } from '../utils/timelineMath';

const UnifiedTimelineBoard = ({
    user,
    colleagues,
    tasks,
    getTasksForColleague,
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
    minTaskDate,
    maxTaskDate,
    onDateScroll,
    showDoneTasks,
    toggleShowDoneTasks
}) => {
    const navigate = useNavigate();
    const scrollContainerRef = React.useRef(null);
    const selectionBoxRef = React.useRef(null);
    const boardRef = React.useRef(null);

    const [showLeftArrow, setShowLeftArrow] = React.useState(false);
    const [showRightArrow, setShowRightArrow] = React.useState(false);

    /**
     * Column Width & Virtualization
     * Scale represents pixels per day; weekends render at 50% width
     */
    const getColumnWidth = React.useCallback((date, overrideScale) => {
        const s = overrideScale || scale || 96;
        return getDayWidth(date, s);
    }, [scale]);

    // Define virtual timeline window (+/- 2 years from today)
    const { virtualStartDate, virtualEndDate, totalVirtualWidth } = React.useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const start = new Date(now);
        start.setFullYear(start.getFullYear() - 2);

        const end = new Date(now);
        end.setFullYear(end.getFullYear() + 2);

        const width = getPixelOffsetFromStart(end, start, scale || 96);

        return {
            virtualStartDate: start,
            virtualEndDate: end,
            totalVirtualWidth: width
        };
    }, [scale]);

    // Track scroll position for virtualization
    const [visibleRange, setVisibleRange] = React.useState({ startPixel: 0, endPixel: 1000 });
    const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
    const [scrollPos, setScrollPos] = React.useState(0);
    const lastUpdateScrollPos = React.useRef(0);

    // Monitor viewport width changes
    React.useLayoutEffect(() => {
        if (!scrollContainerRef.current) return;

        const updateWidth = () => {
            const w = scrollContainerRef.current.clientWidth;
            const h = scrollContainerRef.current.clientHeight;
            setContainerSize({ width: w, height: h });
        };

        const ro = new ResizeObserver(updateWidth);
        ro.observe(scrollContainerRef.current);

        updateWidth();

        return () => ro.disconnect();
    }, []);

    // Calculate visible days based on scroll position (with buffer)
    const visibleDays = React.useMemo(() => {
        const bufferPixels = 1000;
        const renderStartPixel = Math.max(0, visibleRange.startPixel - bufferPixels);
        const renderEndPixel = Math.min(totalVirtualWidth, visibleRange.endPixel + bufferPixels);

        const startDate = getDateFromPixelOffset(renderStartPixel, virtualStartDate, scale || 96);
        const endDate = getDateFromPixelOffset(renderEndPixel, virtualStartDate, scale || 96);

        const days = [];
        let current = new Date(startDate);
        while (current <= endDate) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return days;
    }, [visibleRange, totalVirtualWidth, virtualStartDate, scale]);

    // Calculate pixel offset for rendering virtualized content
    const contentOffsetX = React.useMemo(() => {
        if (visibleDays.length === 0) return 0;
        return getPixelOffsetFromStart(visibleDays[0], virtualStartDate, scale || 96);
    }, [visibleDays, virtualStartDate, scale]);

    const handleScroll = React.useCallback((e) => {
        const s = e.target.scrollLeft;
        const w = e.target.clientWidth;

        requestAnimationFrame(() => {
            // Update visible range only if scrolled significantly (performance optimization)
            const BUFFER_THRESHOLD = 500;
            const diff = Math.abs(s - (lastUpdateScrollPos.current || 0));

            if (diff > BUFFER_THRESHOLD) {
                lastUpdateScrollPos.current = s;
                setVisibleRange({ startPixel: s, endPixel: s + w });
            }

            // Propagate scroll date using red anchor as reference point
            if (onDateScroll) {
                const anchorPixel = s + horiScrollAnchorX;
                const d = getDateFromPixelOffset(anchorPixel, virtualStartDate, scale || 96);
                onDateScroll(d);
            }
        });

        setShowLeftArrow(s > 20);
        setShowRightArrow(s < (scrollContainerRef.current.scrollWidth - w - 20));

    }, [onDateScroll, virtualStartDate, scale]);

    // Red triangle scroll anchor position (persisted to localStorage)
    const [horiScrollAnchorX, setHoriScrollAnchorX] = React.useState(() => {
        const saved = localStorage.getItem('horiScrollAnchorX');
        return saved ? parseFloat(saved) : TIMELINE_LAYOUT.SCROLL_ANCHOR_X;
    });

    const handleAnchorDrag = React.useCallback((newX) => {
        setHoriScrollAnchorX(newX);
        localStorage.setItem('horiScrollAnchorX', newX);
    }, []);

    // Selection & interaction state
    const {
        selectedTaskIds, setSelectedTaskIds, isSelecting,
        handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, handleLostPointerCapture,
    } = useTimelineSelection(scrollContainerRef, selectionBoxRef);

    const sidebarWidth = showSidebar ? TIMELINE_LAYOUT.SIDEBAR_WIDTH : 0;

    const { isRestored, syncedScale, setInteracted } = useSyncedTimelineState(
        scrollContainerRef,
        virtualStartDate,
        scale,
        viewOffset,
        horiScrollAnchorX,
        sidebarWidth
    );

    // Modal state
    const [contextMenu, setContextMenu] = React.useState(null);
    const [expandedTaskId, setExpandedTaskId] = React.useState(null);
    const [isShiftKey, setIsShiftKey] = React.useState(false);

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

    // Context menu handler
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

    // Keyboard event handlers
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

    // Scroll utilities
    const { scrollToDate, scrollToTarget } = useTimelineScroll({
        scrollContainerRef,
        virtualStartDate,
        scale,
        getColumnWidth,
        viewOffset,
        setInteracted,
        controlsRef,
        horiScrollAnchorX,
        sidebarWidth
    });

    // Expose control methods
    React.useImperativeHandle(controlsRef, () => ({
        scrollToDate,
        scrollToTarget,
        setShowCustomScale
    }), [scrollToDate, scrollToTarget]);



    const handleScaleChange = (newScale) => setScale(newScale);

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
            {headerContent && <div className="shrink-0 mb-1.5">{headerContent}</div>}

            <div ref={boardRef} className={`flex-1 bg-white ${showSidebar ? 'rounded-[2.5rem] border border-slate-300' : 'rounded-2xl border border-slate-300'} shadow-sm flex flex-col overflow-hidden relative`}>
                <HoriScrollTargetPoint
                    positionX={horiScrollAnchorX}
                    onDrag={handleAnchorDrag}
                    minX={TIMELINE_LAYOUT.SIDEBAR_WIDTH + 50}
                    containerRef={boardRef}
                    rightBuffer={100}
                />

                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
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
                    <div style={{ width: totalVirtualWidth, height: '100%', position: 'relative' }}>

                        <div style={{
                            position: 'relative',
                            left: `${contentOffsetX}px`,
                            width: 'fit-content',
                        }}>
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
                                days={visibleDays}
                                getColumnWidth={getColumnWidth}
                                isToday={isToday}
                                isWeekend={isWeekend}
                                onContextMenu={handleContextMenu}
                                showSidebar={showSidebar}
                                onWheel={handleHeaderWheel}
                                scale={scale}
                            />

                            <TimelineBody
                                colleagues={colleagues}
                                days={visibleDays}
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
                                virtualStartDate={visibleDays.length > 0 ? visibleDays[0] : virtualStartDate}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}
                    items={
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
                                setSelectedTaskIds,
                                scale,
                                showDoneTasks,
                                toggleShowDoneTasks
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
                scale={scale}
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
