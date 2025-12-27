import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Calendar, Shield } from 'lucide-react';
import FilterAndSortToolbar from '../components/shared/filters/FilterAndSortToolbar';
import { useAuth } from '../context/AuthContext';
import { useTimelineState } from '../hooks/useTimelineState';
import { useTimelineScale } from '../hooks/useTimelineScale';
import { useTimelineDateRange } from '../hooks/useTimelineDateRange';
import TimelineSkeleton from '../components/TimelineSkeleton';
import TimelineControls from '../components/TimelineControls';
import UnifiedTimelineBoard from '../components/UnifiedTimelineBoard';
import { TimelineRegistryProvider } from '../context/TimelineRegistryContext';
import PageLayout from '../components/layout/PageLayout';

/**
 * TimelinesPage Component
 * 
 * Full-team timeline view showing all colleagues and their task assignments in a
 * horizontal scrolling grid. Main administrative interface for task management.
 * 
 * Architecture:
 * - UnifiedTimelineBoard: Core timeline grid (colleague rows × date columns)
 * - FilterAndSortToolbar: Multi-dimensional filtering (colleagues, tasks, projects)
 * - TimelineControls: Navigation (today, first match, zoom controls)
 * - PageLayout: Standard page wrapper with header/filters
 * 
 * State Management Strategy:
 * - useTimelineState: Centralized state for tasks, colleagues, filters, delegations
 * - useTimelineScale: User-specific zoom level (persisted per-user)
 * - useTimelineDateRange: Date range calculation for timeline columns
 * - controlsRef: Allows header controls to trigger UnifiedBoard scroll methods
 * 
 * Key Features:
 * 1. **Multi-Level Filtering**:
 *    - Colleague filters (show/hide team members)
 *    - Task filters (status, priority, keywords)
 *    - Project filters (filter by project assignment)
 *    - Empty row hiding (collapse colleagues with no visible tasks)
 * 
 * 2. **Timeline Navigation**:
 *    - TODAY button: Scroll to current date
 *    - FIRST MATCH button: Jump to earliest filtered task
 *    - Custom scale: Adjust density (inches per day)
 *    - URL-based highlighting (highlightTaskId query param)
 * 
 * 3. **Task Management**:
 *    - Drag-and-drop reassignment (between colleagues)
 *    - Drag-and-drop rescheduling (across dates)
 *    - Bulk operations (multi-select + context menu)
 *    - Inline editing (right-click context menu)
 * 
 * 4. **Delegation System**:
 *    - Temporary admin grants (delegationMap)
 *    - Expiration tracking (visual badge if user.isDelegated)
 *    - Revocation controls (handleRevokeDelegation)
 * 
 * 5. **Scroll Synchronization**:
 *    - controlsRef exposes scrollToDate from UnifiedBoard
 *    - Header controls call scrollToDate via ref
 *    - Preserves scroll position on filter changes (TimelineViewContext)
 * 
 * Date Normalization:
 * - All dates normalized to midnight (setHours(0,0,0,0))
 * - Done tasks scroll to completedAt, others to dueDate
 * - isToday helper checks equality at midnight precision
 * 
 * URL Integration:
 * - highlightTaskId: Auto-scroll and highlight task from URL
 * - Enables deep linking from notifications/dashboards
 * 
 * Performance Optimizations:
 * - Virtualized scrolling in UnifiedBoard (only renders visible columns)
 * - Memoized task lookups (getTasksForColleague)
 * - Filtered colleague list prevents unnecessary renders
 * 
 * @param {Object} props
 * @component
 */
const TimelinesPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Extract URL parameter for auto-highlighting a specific task
    const highlightTaskId = searchParams.get('highlightTaskId');
    const { user } = useAuth();

    // -- State Hooks: Centralized timeline state management --
    const {
        tasks, refetchTasks, colleagues, projectsData,
        colleagueFilters, setColleagueFilters,
        taskFilters, setTaskFilters,
        projectFilters, setProjectFilters,
        sortConfig, setSortConfig,
        hideEmptyRows, setHideEmptyRows,
        resetAll,
        visibleColleagues, filteredTasks,
        delegationMap, handleRevokeDelegation,
        handleUpdateTask, handleBulkUpdate, handleMoveDate, handleDeleteTasks,
        getTasksForColleague, setDelegations,
        loading,
        showDoneTasks, setShowDoneTasks
    } = useTimelineState(user);

    const { scale, setScale } = useTimelineScale(user); // User-specific zoom (persisted)

    // Generate date range for timeline columns (e.g., 90 days centered on today)
    const days = useTimelineDateRange();

    /**
     * Check if a date is today (midnight-normalized comparison)
     */
    const isToday = (d) => {
        const t = new Date(); t.setHours(0, 0, 0, 0);
        return d.getTime() === t.getTime();
    };

    // Ref for accessing UnifiedBoard's scrollToDate from header controls
    const controlsRef = React.useRef({});

    /**
     * Scroll to today's date in the timeline
     * Triggered by TODAY button in TimelineControls
     */
    const handleTodayClick = () => {
        if (controlsRef.current.scrollToDate) {
            controlsRef.current.scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)));
        }
    };

    /**
     * Scroll to the earliest filtered task
     * Triggered by FIRST MATCH button (only enabled when filters active)
     * 
     * Logic:
     * 1. Determine effective date for each task:
     *    - Done tasks: Use completedAt (when task was finished)
     *    - Other tasks: Use dueDate (when task is scheduled)
     * 2. Filter to tasks visible in current colleague filter
     * 3. Sort by effective date (earliest first)
     * 4. Scroll to earliest task's date
     */
    const handleGoToFirst = () => {
        if (!filteredTasks || filteredTasks.length === 0) return;

        // Get relevant date for scrolling: completion date for done tasks, due date otherwise
        const getEffectiveDate = (t) => {
            if (t.status === 'done' && t.completedAt) return new Date(t.completedAt);
            if (t.dueDate) return new Date(t.dueDate);
            return null;
        };

        // Find earliest task that's visible in filtered colleague list
        const visibleIds = new Set(visibleColleagues.map(c => c.id));

        const validTasks = filteredTasks.filter(t => {
            const hasAssignee = t.assignedTo && t.assignedTo.length > 0;
            const isVisible = hasAssignee
                ? t.assignedTo.some(id => visibleIds.has(id))
                : visibleIds.has(t.createdBy); // Unassigned tasks shown in creator's row

            if (!isVisible) return false;

            const d = getEffectiveDate(t);
            return d && !isNaN(d.getTime()); // Only tasks with valid dates
        });

        if (validTasks.length > 0) {
            validTasks.sort((a, b) => getEffectiveDate(a) - getEffectiveDate(b));

            const firstTask = validTasks[0];
            const minDate = getEffectiveDate(firstTask);

            if (minDate && controlsRef.current.scrollToDate) {
                minDate.setHours(0, 0, 0, 0); // Normalize to midnight
                controlsRef.current.scrollToDate(minDate);
            }
        }
    };

    // Prepare Toolbar for Injection
    const filterToolbar = (
        <div className="flex justify-start w-full">
            <FilterAndSortToolbar
                tasks={tasks}
                colleagues={visibleColleagues}
                projectsData={projectsData}

                colleagueFilters={colleagueFilters}
                setColleagueFilters={setColleagueFilters}

                taskFilters={taskFilters}
                setTaskFilters={setTaskFilters}

                projectFilters={projectFilters}
                setProjectFilters={setProjectFilters}

                sortConfig={sortConfig}
                setSortConfig={setSortConfig}

                hideEmptyRows={hideEmptyRows}
                setHideEmptyRows={setHideEmptyRows}
                resetAll={resetAll}

                showProjectControls={true}
            />
        </div>
    );

    // Update Header with click handler
    const headerWithClick = (
        <header className="flex items-center justify-between gap-8 relative h-[50px] shrink-0">
            <div className="shrink-0">
                {user?.isDelegated && (
                    <div className="absolute -top-12 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 shadow-sm animate-in slide-in-from-top-2 fade-in">
                        <Shield size={14} className="text-amber-600" />
                        <span>You are acting as a Temporary Admin. Access expires on {new Date(user.delegationExpiresAt).toLocaleDateString()}.</span>
                    </div>
                )}
                <div className="flex items-baseline gap-4">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Timelines</h2>
                    <p className="text-slate-500 text-lg">Manage assignments and schedules.</p>
                </div>
            </div>
            <div className="flex items-end gap-4 shrink-0 translate-y-[42px] z-50">
                <TimelineControls
                    onTodayClick={handleTodayClick}
                    onGoToFirst={handleGoToFirst}
                    showGoToFirst={taskFilters.length > 0}
                    scale={scale}
                    onScaleClick={() => controlsRef.current?.setShowCustomScale?.(true)}
                />
            </div>
        </header>
    );



    return (
        <PageLayout
            title="Timelines"
            subtitle="Manage assignments and schedules."
            actions={
                <div className="flex items-center gap-4">
                    {user?.isDelegated && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 shadow-sm animate-in slide-in-from-top-2 fade-in mr-4">
                            <Shield size={14} className="text-amber-600" />
                            <span>Acting as Temp Admin (Expires {new Date(user.delegationExpiresAt).toLocaleDateString()})</span>
                        </div>
                    )}

                </div>
            }
            filters={
                <div className="flex items-end justify-between gap-4 w-full">
                    <div className="flex-1 min-w-0">
                        <FilterAndSortToolbar
                            tasks={tasks}
                            colleagues={visibleColleagues}
                            projectsData={projectsData}

                            colleagueFilters={colleagueFilters}
                            setColleagueFilters={setColleagueFilters}

                            taskFilters={taskFilters}
                            setTaskFilters={setTaskFilters}

                            projectFilters={projectFilters}
                            setProjectFilters={setProjectFilters}

                            sortConfig={sortConfig}
                            setSortConfig={setSortConfig}

                            hideEmptyRows={hideEmptyRows}
                            setHideEmptyRows={setHideEmptyRows}
                            resetAll={resetAll}

                            showProjectControls={true}
                        />
                    </div>

                    <div className="shrink-0">
                        <TimelineControls
                            onTodayClick={handleTodayClick}
                            onGoToFirst={handleGoToFirst}
                            showGoToFirst={taskFilters.length > 0}
                            scale={scale}
                            onScaleClick={() => controlsRef.current?.setShowCustomScale?.(true)}
                        />
                    </div>
                </div>
            }
        >
            <TimelineRegistryProvider>
                <UnifiedTimelineBoard
                    user={user}
                    colleagues={visibleColleagues}
                    tasks={tasks}
                    getTasksForColleague={getTasksForColleague}

                    days={days}
                    isToday={isToday}
                    isWeekend={(d) => [0, 6].includes(d.getDay())}
                    scale={scale}
                    setScale={setScale}

                    onUpdateTask={handleUpdateTask}
                    onBulkUpdate={handleBulkUpdate}
                    onDeleteTasks={handleDeleteTasks}
                    onMoveDate={handleMoveDate}
                    refetchTasks={refetchTasks}

                    showSidebar={true}
                    viewOffset={200}


                    // Expose controls
                    controlsRef={controlsRef}

                    // Delegation
                    delegationMap={delegationMap}
                    handleRevokeDelegation={handleRevokeDelegation}
                    onDelegateConfig={setDelegations}
                    showDoneTasks={showDoneTasks}
                    toggleShowDoneTasks={() => setShowDoneTasks(prev => !prev)}
                />
            </TimelineRegistryProvider>
        </PageLayout>
    );
};

export default TimelinesPage;