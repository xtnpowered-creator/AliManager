import React, { useCallback } from 'react';
import { useTimelineActions } from '../../hooks/timeline/useTimelineActions';
import { useToast } from '../../context/ToastContext';
import UnifiedTimelineBoard from '../UnifiedTimelineBoard';
import { TimelineRegistryProvider } from '../../context/TimelineRegistryContext';
import { useTimelineDateRange } from '../../hooks/useTimelineDateRange';

/**
 * DashboardTimeline Component
 * 
 * Simplified single-row timeline view for MyDashboard page.
 * Shows only the current user's tasks in a compact horizontal timeline.
 * 
 * Key Differences from TimelinesPage:
 * - showSidebar={false}: No colleague column (just task grid)
 * - colleagues={[user]}: Only current user's row
 * - viewOffset={0}: No sidebar offset for horizontal positioning
 * - No delegation features (admin-only)
 * 
 * Architecture:
 * - Wraps UnifiedTimelineBoard with dashboard-specific props
 * - Leverages shared timeline logic (zoom, scroll, drag)
 * - Uses useTimelineActions for task mutations (optimistic updates)
 * - Provides getTasksAdapter to match expected interface
 * 
 * Task Assignment Logic:
 * - Explicit assignment: task.assignedTo includes user ID
 * - Unassigned fallback: No assignedTo + task.createdBy === user ID
 * - Matches logic from useTimelineState.getTasksForColleague
 * 
 * Date Scroll Coordination:
 * - Receives onDateScroll prop from parent
 * - Forwards scroll events to sync DetailedTaskDayView
 * - Both components scroll in parallel for consistent navigation
 * 
 * @param {Object} props
 * @param {Array} props.initialTasks - Filtered user tasks
 * @param {Object} props.user - Current user object
 * @param {Function} props.refetchTasks - Refetch after mutations
 * @param {Function} props.setTasks - Optimistic update setter
 * @param {number} props.scale - Timeline zoom level
 * @param {Function} props.setScale - Update zoom level
 * @param {React.RefObject} props.controlsRef - Expose scroll methods
 * @param {Function} props.onDateScroll - Callback when scroll position changes
 * @param {boolean} props.showDoneTasks - Show/hide completed tasks
 * @param {Function} props.toggleShowDoneTasks - Toggle completion visibility
 */
const DashboardTimeline = ({ initialTasks, user, refetchTasks, setTasks, scale, setScale, controlsRef, onDateScroll, showDoneTasks, toggleShowDoneTasks }) => {
    const { showToast } = useToast();

    // Generate date range for timeline (90-day static range)
    const days = useTimelineDateRange();

    // Shared task action handlers (optimistic updates + API calls)
    const {
        handleUpdateTask,
        handleBulkUpdate,
        handleDeleteTasks,
        handleMoveDate
    } = useTimelineActions({
        tasks: initialTasks,
        setTasks,
        refetchTasks
    });

    /**
     * Task Adapter for UnifiedBoard
     * Matches interface expected by UnifiedTimelineBoard.getTasksForColleague
     * 
     * Logic:
     * 1. Explicit assignment: task.assignedTo array includes colleagueId
     * 2. Unassigned fallback: empty/null assignedTo + createdBy matches
     */
    const getTasksAdapter = useCallback((colleagueId) => {
        return initialTasks.filter(t => {
            // 1. Explicit Assignment
            if (t.assignedTo && t.assignedTo.includes(colleagueId)) return true;

            // 2. Unassigned Fallback (self-assigned to creator)
            const isUnassigned = !t.assignedTo || t.assignedTo.length === 0;
            if (isUnassigned && t.createdBy === colleagueId) return true;

            return false;
        });
    }, [initialTasks]);

    if (!user) return null;

    return (
        <div className="flex flex-col rounded-2xl bg-white overflow-hidden select-none relative h-auto">
            <TimelineRegistryProvider>
                <UnifiedTimelineBoard
                    user={user}
                    colleagues={[user]}             // Single row: current user only
                    tasks={initialTasks}
                    getTasksForColleague={getTasksAdapter}

                    days={days}
                    isToday={(d) => d.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)}
                    isWeekend={(d) => [0, 6].includes(d.getDay())}
                    scale={scale}
                    setScale={setScale}

                    onUpdateTask={handleUpdateTask}
                    onBulkUpdate={handleBulkUpdate}
                    onDeleteTasks={handleDeleteTasks}
                    onMoveDate={handleMoveDate}
                    refetchTasks={refetchTasks}

                    onDateScroll={onDateScroll}   // Forward scroll events to parent

                    showSidebar={false}           // No colleague column
                    viewOffset={0}                // No sidebar offset
                    headerContent={null}          // No extra header content

                    controlsRef={controlsRef}     // Expose scroll methods

                    // Delegation (not applicable for dashboard)
                    delegationMap={new Map()}
                    showDoneTasks={showDoneTasks}
                    toggleShowDoneTasks={toggleShowDoneTasks}
                />
            </TimelineRegistryProvider>
        </div>
    );
};

export default DashboardTimeline;
