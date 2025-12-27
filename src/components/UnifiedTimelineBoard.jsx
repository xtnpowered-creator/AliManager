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

/**
 * UnifiedTimelineBoard Component
 * 
 * Core horizontal timeline grid for multi-user task visualization and management.
 * Implements virtualization, scroll synchronization, drag-and-drop, bulk selection,
 * and modal orchestration for the primary task management interface.
 * 
 * Architecture Overview:
 * 
 * 1. **Virtual Scrolling Window** (Performance Optimization):
 *    - Virtual range: ±2 years from today (~1460 days)
 *    - Only renders visible days + 1000px buffer on each side
 *    - Dynamically calculates which days to render based on scroll position
 *    - Content offset shifts rendered columns to match scroll position
 *    - Prevents rendering 1460+ columns simultaneously (would freeze UI)
 * 
 * 2. **Column Width Calculation**:
 *    - Weekdays: Full scale width (e.g., 120px at 1.25 inches/day)
 *    - Weekends: 50% width (compressed for space efficiency)
 *    - Dynamic recalculation on scale change
 *    - Uses timelineMath utilities for consistent pixel conversions
 * 
 * 3. **Scroll Synchronization** (useSyncedTimelineState):
 *    - Restores scroll position on mount (prevents jump after navigation)
 *    - Persists scroll per user to TimelineViewContext
 *    - Red anchor triangle: User-draggable reference point (default 350px from left)
 *    - All "scrollToDate" operations align target date with anchor position
 *    - Cross-view sync: Scroll in timeline → updates dashboard day view
 * 
 * 4. **Selection System** (useTimelineSelection):
 *    - Click: Select single task
 *    - Ctrl/Cmd+Click: Toggle task in/out of selection set
 *    - Shift+Drag: Box selection (draws teal selection rectangle)
 *    - Selection box uses pointer capture for smooth dragging
 *    - Selected tasks get ring outline + bulk actions in context menu
 * 
 * 5. **Keyboard Interactions**:
 *    - Shift key: Changes cursor to crosshair (visual cue for selection mode)
 *    - Escape: Clears selection, closes all modals, collapses expanded tasks
 *    - Tracked via window event listeners (works even when timeline unfocused)
 * 
 * 6. **Context Menu Integration**:
 *    - Right-click on tasks: Task-specific actions (edit, delete, reassign, etc.)
 *    - Right-click on date headers: Date actions (flag, create task for date)
 *    - Dynamically generates menu based on click target and permissions
 *    - Delegates to getMenuOptions helper for menu structure
 * 
 * 7. **Modal Orchestration**:
 *    - TimelineModals: Wrapper managing 10+ modal types
 *    - State hoisted here: showDeleteModal, showMoveDateModal, etc.
 *    - Modal callbacks trigger refetchTasks or onUpdateTask
 *    - Escape key closes all modals simultaneously
 * 
 * 8. **Drag-and-Drop** (Handled by TimelineBody):
 *    - Task cards draggable between dates (reschedule)
 *    - Task cards draggable between colleagues (reassign)
 *    - Drag ghosting and drop validation in child components
 * 
 * 9. **Scroll Arrow Indicators**:
 *    - Left/right arrows appear when content extends beyond viewport
 *    - Updated on scroll event (showLeftArrow, showRightArrow)
 *    - Visual cue that more content exists
 * 
 * 10. **Viewport Resize Handling**:
 *     - ResizeObserver tracks container width/height changes
 *     - Recalculates visible range on resize (prevents render gaps)
 *     - Updates on window resize, sidebar toggle, zoom changes
 * 
 * Performance Optimizations:
 * - **Virtualization**: Renders ~30-50 days instead of 1460
 * - **Buffer Threshold**: Only updates visible range after 500px scroll (prevents thrashing)
 * - **requestAnimationFrame**: Defers scroll updates to next paint
 * - **React.memo on TaskCard**: Prevents re-render of unchanged cards
 * - **useMemo on visibleDays**: Prevents recalculating day list on unrelated state changes
 * 
 * State Management:
 * - **Local State**: UI state (modals, selection, context menu)
 * - **Synced State**: Scroll position (TimelineViewContext)
 * - **Parent State**: Tasks, colleagues, scale, filters
 * - **Ref-based**: Scroll container, selection box (imperative DOM access)
 * 
 * Exposed Methods (via controlsRef):
 * - scrollToDate(date): Programmatic scroll to specific date
 * - scrollToTarget(target): Scroll to element or pixel position
 * - setShowCustomScale(bool): Open custom scale modal
 * 
 * Date Range Calculation:
 * - Virtual window: 2 years past → 2 years future
 * - Total width: Calculated via getPixelOffsetFromStart (accounts for weekend compression)
 * - Buffer rendering: ±1000px from viewport edges (smooth scrolling)
 * 
 * Coordinate Systems:
 * - **Pixel Offset**: Distance from virtualStartDate in pixels
 * - **Date**: Midnight-normalized Date objects
 * - **Scroll Position**: Container scrollLeft value
 * - **Anchor Position**: User-configurable reference point (red triangle)
 * 
 * Anchor Triangle Behavior:
 * - Draggable via HoriScrollTargetPoint component
 * - Position persisted to localStorage
 * - "Today" button scrolls to align current date with anchor
 * - "First Match" button scrolls to align earliest filtered task with anchor
 * 
 * Event Flow Examples:
 * 
 * **Scroll to Today**:
 * 1. TimelineControls calls controlsRef.current.scrollToDate(today)
 * 2. useTimelineScroll calculates pixel offset for today
 * 3. Scrolls container so today aligns with anchor position
 * 4. Triggers handleScroll → updates visible range → re-renders new columns
 * 
 * **Task Selection**:
 * 1. User clicks task → onTaskClick fires
 * 2. Ctrl held? Toggle task in/out of selectedTaskIds Set
 * 3. No Ctrl? Replace selection with single task
 * 4. TaskCard receives isSelected prop → shows ring outline
 * 
 * **Context Menu → Delete**:
 * 1. Right-click task → handleContextMenu
 * 2. ContextMenu renders with Delete option
 * 3. Click Delete → getMenuOptions callback sets showDeleteModal(true)
 * 4. DeleteTaskModal renders, user confirms
 * 5. Modal calls onDeleteTasks(selectedTaskIds)
 * 6. Parent deletes tasks, calls refetchTasks
 * 7. New task list flows down, timeline updates
 * 
 * Integration Points:
 * - **TimelineHeader**: Date column headers (day/date/weekday)
 * - **TimelineBody**: Colleague rows with task cards
 * - **ContextMenu**: Right-click actions
 * - **TimelineModals**: All modal dialogs
 * - **HoriScrollTargetPoint**: Draggable red anchor triangle
 * 
 * Props Categorization:
 * - **Data**: tasks, colleagues, user, delegationMap
 * - **Callbacks**: onUpdateTask, onDeleteTasks, onBulkUpdate, refetchTasks
 * - **View State**: scale, showSidebar, showDoneTasks
 * - **Config**: viewOffset, minTaskDate, maxTaskDate
 * - **Refs**: controlsRef (expose scroll methods)
 * 
 * @param {Object} props
 * @param {Object} props.user - Current user object
 * @param {Array} props.colleagues - Filtered colleague list (rows)
 * @param {Array} props.tasks - All tasks (filtered by parent)
 * @param {Function} props.getTasksForColleague - Returns tasks for specific colleague
 * @param {Function} props.isToday - Date comparison helper
 * @param {Function} props.isWeekend - Date comparison helper
 * @param {number} props.scale - Pixels per weekday
 * @param {Function} props.setScale - Update scale
 * @param {Function} props.onUpdateTask - Single task update callback
 * @param {Function} props.onBulkUpdate - Multi-task update callback
 * @param {Function} props.onDeleteTasks - Delete tasks callback
 * @param {Function} props.onMoveDate - Reschedule callback
 * @param {Function} props.refetchTasks - Refresh tasks from API
 * @param {boolean} [props.showSidebar=false] - Show colleague name sidebar
 * @param {number} [props.viewOffset=0] - Additional scroll offset
 * @param {ReactNode} props.headerContent - Optional header above timeline
 * @param {Map} [props.delegationMap=new Map()] - Temporary admin grants
 * @param {Function} props.handleRevokeDelegation - Revoke temp admin
 * @param {Function} props.onDelegateConfig - Configure delegation
 * @param {boolean} [props.loading=false] - Loading state
 * @param {Object} props.controlsRef - Ref to expose scroll methods
 * @param {Date} props.minTaskDate - Earliest task date (unused)
 * @param {Date} props.maxTaskDate - Latest task date (unused)
 * @param {Function} props.onDateScroll - Callback when scroll date changes
 * @param {boolean} props.showDoneTasks - Show completed tasks
 * @param {Function} props.toggleShowDoneTasks - Toggle done task visibility
 * @component
 */
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
