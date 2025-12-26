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
import { getPixelOffsetFromStart, getDateFromPixelOffset, getDayWidth } from '../utils/timelineMath';

const UnifiedTimelineBoard = ({
    user,
    colleagues,
    tasks,
    getTasksForColleague,
    // days, // Deprecated: We now generate this internally for virtualization
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
    onDateScroll, // New Callback prop
    showDoneTasks,
    toggleShowDoneTasks
}) => {
    const navigate = useNavigate();
    const scrollContainerRef = React.useRef(null);
    const selectionBoxRef = React.useRef(null);
    const boardRef = React.useRef(null);

    // Scroll Arrows State
    const [showLeftArrow, setShowLeftArrow] = React.useState(false);
    const [showRightArrow, setShowRightArrow] = React.useState(false);

    // 1. Column Width & Virtualization Math
    // Scale is "Pixels Per Day".
    // Weekends 50% width
    const getColumnWidth = React.useCallback((date, overrideScale) => {
        const s = overrideScale || scale || 96;
        return getDayWidth(date, s);
    }, [scale]);

    // -- VIRTUALIZATION ENGINE --
    // A. Define the Infinite Window (e.g., +/- 2 Years)
    const { virtualStartDate, virtualEndDate, totalVirtualWidth } = React.useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const start = new Date(now);
        start.setFullYear(start.getFullYear() - 2); // T-2 Years

        const end = new Date(now);
        end.setFullYear(end.getFullYear() + 2); // T+2 Years

        const width = getPixelOffsetFromStart(end, start, scale || 96);

        return {
            virtualStartDate: start,
            virtualEndDate: end,
            totalVirtualWidth: width
        };
    }, [scale]);

    // B. Track Scroll Position
    const [visibleRange, setVisibleRange] = React.useState({ startPixel: 0, endPixel: 1000 }); // Default
    const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
    const [scrollPos, setScrollPos] = React.useState(0);
    const lastUpdateScrollPos = React.useRef(0);

    // Resize Observer to know Viewport Width
    React.useLayoutEffect(() => {
        if (!scrollContainerRef.current) return;

        const updateWidth = () => {
            // Initial Set
            const w = scrollContainerRef.current.clientWidth;
            const h = scrollContainerRef.current.clientHeight;
            setContainerSize({ width: w, height: h });
            // The initial scroll position will be handled by the handleScroll function
        };

        const ro = new ResizeObserver(updateWidth);
        ro.observe(scrollContainerRef.current);

        // Initial call
        updateWidth();

        return () => ro.disconnect();
    }, []);

    // C. Calculate Visible Days (The Virtual Subset)
    const visibleDays = React.useMemo(() => {
        const bufferPixels = 1000; // Render +/- 1000px buffer
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

    // D. Helper to get pixel offset for rendering content
    // The "Start Date" of our rendered array is offset by X pixels from the Virtual Start.
    const contentOffsetX = React.useMemo(() => {
        if (visibleDays.length === 0) return 0;
        return getPixelOffsetFromStart(visibleDays[0], virtualStartDate, scale || 96);
    }, [visibleDays, virtualStartDate, scale]);

    // Sync Scroll Handlers
    const handleScroll = React.useCallback((e) => {
        const s = e.target.scrollLeft;
        const w = e.target.clientWidth;

        // Update State (Throttle this in production, but for now direct)
        // RequestAnimationFrame for smoothness?
        requestAnimationFrame(() => {

            // OPTIMIZATION: Only update React State (visibleRange) if we have scrolled
            // significantly enough to need a new chunk of days rendered.
            // We have a 1000px buffer. Let's update if we convert > 500px of that buffer.

            // We need a ref to track the last "State Update" position to compare against 's'
            // without needing 'visibleRange' in the dependency array (which would recreate the handler).
            // Let's assume we add `lastUpdateScrollPos` ref.

            const BUFFER_THRESHOLD = 500;
            const diff = Math.abs(s - (lastUpdateScrollPos.current || 0));

            if (diff > BUFFER_THRESHOLD) {
                lastUpdateScrollPos.current = s;
                setVisibleRange({ startPixel: s, endPixel: s + w });
            }

            // Propagate deprecated onDateScroll hooks if needed?
            if (onDateScroll) {
                // Use the Red Arrow (Anchor) as the reference point, not the center.
                // This ensures that whatever is under the arrow is considered the "Focus Date".
                const anchorPixel = s + horiScrollAnchorX;
                const d = getDateFromPixelOffset(anchorPixel, virtualStartDate, scale || 96);
                onDateScroll(d);
            }
        });

        // Arrow Logic
        setShowLeftArrow(s > 20);
        setShowRightArrow(s < (scrollContainerRef.current.scrollWidth - w - 20));

    }, [onDateScroll, virtualStartDate, scale]);

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

    const sidebarWidth = showSidebar ? TIMELINE_LAYOUT.SIDEBAR_WIDTH : 0;

    const { isRestored, syncedScale, setInteracted } = useSyncedTimelineState(
        scrollContainerRef,
        virtualStartDate,
        scale,
        viewOffset,
        horiScrollAnchorX,
        sidebarWidth // Pass Sidebar Width
    );

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
        virtualStartDate,
        scale,
        getColumnWidth,
        viewOffset,
        setInteracted,
        controlsRef,
        horiScrollAnchorX,
        sidebarWidth // Pass Sidebar Width
    });

    // Expose Modal Controls
    React.useImperativeHandle(controlsRef, () => ({
        scrollToDate,
        scrollToTarget,
        setShowCustomScale
    }), [scrollToDate, scrollToTarget]);



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
                    onScroll={handleScroll} // ATTACH VIRTUAL SCROLL HANDLER
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
                    {/* VIRTUALIZATION SPACER */}
                    <div style={{ width: totalVirtualWidth, height: '100%', position: 'relative' }}>

                        {/* VIRTUAL CONTENT WINDOW (Offset) */}
                        <div style={{
                            position: 'relative', // Changed from absolute to preserve height flow
                            left: `${contentOffsetX}px`, // Changed from transform to avoid sticky context issues
                            width: 'fit-content',
                            // Removed top/bottom/willChange constraint to allow content to dictate height
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
                                // Pass visibleDays[0] as the start for Local Relative Positioning
                                virtualStartDate={visibleDays.length > 0 ? visibleDays[0] : virtualStartDate}
                            />
                        </div>
                    </div>
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
