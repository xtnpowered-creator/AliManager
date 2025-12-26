import React from 'react';
import { Clock } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import DashboardTimeline from '../components/dashboard/DashboardTimeline';
import TaskColumn from '../components/dashboard/TaskColumn';
import TimelineControls from '../components/TimelineControls';
import FilterAndSortToolbar from '../components/shared/filters/FilterAndSortToolbar';
import { useFilterAndSortTool } from '../hooks/useFilterAndSortTool';
import DetailedTaskDayView from '../components/dashboard/DetailedTaskDayView';
import { TimelineRegistryProvider } from '../context/TimelineRegistryContext';

import { useTimelineScale } from '../hooks/useTimelineScale';

const MyDashboard = () => {
    const { user } = useAuth();
    const { data: tasks, loading: tasksLoading, refetch: refetchTasks, setData: setTasks } = useApiData('/tasks');
    const { data: colleagues } = useApiData('/colleagues');
    const { data: projects } = useApiData('/projects');

    // -- Filter Tool Hook --
    const {
        filteredTasks,
        visibleColleagues,
        colleagueFilters, setColleagueFilters,
        taskFilters, setTaskFilters,
        projectFilters, setProjectFilters,
        sortConfig, setSortConfig,
        hideEmptyRows, setHideEmptyRows,
        resetAll
    } = useFilterAndSortTool(tasks, colleagues, projects, user);

    // Timeline Controls State
    const { scale, setScale } = useTimelineScale(user); // User-specific scale
    const [showDoneTasks, setShowDoneTasks] = React.useState(true); // Default: Show Done Tasks
    const controlsRef = React.useRef({}); // Timeline Controls
    const dayViewControlsRef = React.useRef({}); // DayView Controls

    const handleTodayClick = () => {
        const today = new Date(new Date().setHours(0, 0, 0, 0));

        // Scroll Timeline
        if (controlsRef.current.scrollToDate) {
            controlsRef.current.scrollToDate(today);
        }

        // Scroll DayView
        if (dayViewControlsRef.current.scrollToDate) {
            dayViewControlsRef.current.scrollToDate(today);
        }
    };

    const { myTasks, delegatedTasks, myCompleted } = React.useMemo(() => {
        // Use filteredTasks instead of raw tasks
        if (!user || !filteredTasks) return { myTasks: [], delegatedTasks: [], myCompleted: [] };

        const userId = user.uid || user.id;
        const overdue = [];
        const upcoming = [];
        const delegated = [];  // <--- Restored
        const completed = [];  // <--- Restored

        // Helper: Is Overdue?
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Fast Lookup for Visible Colleagues
        const visibleIds = new Set(visibleColleagues.map(c => c.id));

        filteredTasks.forEach(task => {
            const isAssignedToMe = task.assignedTo?.includes(userId);
            const isCreatedByMe = task.createdBy === userId;
            const isUnassigned = (!task.assignedTo || task.assignedTo.length === 0);

            // Handle DONE tasks
            if (task.status === 'done') {
                if (isAssignedToMe || (isCreatedByMe && isUnassigned)) {
                    completed.push(task);
                }
                if (!showDoneTasks) return;
            }

            if (isAssignedToMe || (isCreatedByMe && isUnassigned)) {
                // Check Overdue (Internal split for potential logic, but we merge for display)
                if (task.status !== 'done' && task.dueDate) {
                    const d = new Date(task.dueDate);
                    d.setHours(0, 0, 0, 0);
                    if (d < now) {
                        overdue.push(task);
                        return;
                    }
                }
                upcoming.push(task);
            } else if (isCreatedByMe && !isAssignedToMe && !isUnassigned) {
                const isDelegateVisible = task.assignedTo.some(id => visibleIds.has(id));
                if (isDelegateVisible) {
                    delegated.push(task);
                }
            }
        });

        const sortFn = (a, b) => {
            if (a.priority === '1' && b.priority !== '1') return -1;
            if (a.priority !== '1' && b.priority === '1') return 1;
            const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
            const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
            return dateA - dateB;
        };

        // Merge Overdue + Upcoming for a single "My Priorities" list, sorted by date/priority
        // Since sortFn handles dates, a simple merge + sort is enough. 
        // Or specific: Overdue (sorted) + Upcoming (sorted).
        // Let's just merge and sort to be safe and simple.
        const allMyTasks = [...overdue, ...upcoming].sort(sortFn);

        return {
            myTasks: allMyTasks,
            delegatedTasks: delegated.sort(sortFn),
            myCompleted: completed
        };
    }, [filteredTasks, user, visibleColleagues, showDoneTasks]);

    const handleGoToFirst = () => {
        if (!myTasks || myTasks.length === 0) return;

        // Helper to get effective date
        const getEffectiveDate = (t) => {
            if (t.status === 'done' && t.completedAt) return new Date(t.completedAt);
            if (t.dueDate) return new Date(t.dueDate);
            return null;
        };

        const validTasks = myTasks.filter(t => {
            const d = getEffectiveDate(t);
            return d && !isNaN(d.getTime());
        });

        if (validTasks.length > 0) {
            // Sort by Date ASC to find the earliest occurrence
            validTasks.sort((a, b) => getEffectiveDate(a) - getEffectiveDate(b));

            const firstTask = validTasks[0];
            const minDate = getEffectiveDate(firstTask);

            if (minDate) {
                minDate.setHours(0, 0, 0, 0);

                // Scroll Timeline
                if (controlsRef.current.scrollToDate) {
                    controlsRef.current.scrollToDate(minDate);
                }

                // Scroll DayView
                if (dayViewControlsRef.current.scrollToDate) {
                    dayViewControlsRef.current.scrollToDate(minDate);
                }
            }
        }
    };

    // Guard: Redirect if no user (should be handled by ProtectedRoute but this is a fail-safe)
    if (!user) return <div className="p-8 text-center text-slate-400">Not Authenticated. Please refresh or login.</div>;

    return (
        <PageLayout
            title="My Dashboard"
            subtitle="Your priorities and team delegations."
            filters={
                <div className="flex items-end justify-between gap-4 w-full">
                    <div className="flex-1 min-w-0">
                        <FilterAndSortToolbar
                            tasks={tasks}
                            colleagues={visibleColleagues} // Use visible to filter suggestions if needed, or raw? Usually raw for suggestions.
                            // But hook returns visibleColleagues. Toolbar expects `colleagues` for suggestions.
                            // Toolbar uses `colleagues` prop to generate "Department" lists.
                            // If we pass `visibleColleagues`, the dropdowns shrink as we filter.
                            // This defines "Faceted Search" behavior. It's generally good.
                            projectsData={projects}

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
                            showPeopleControls={true} // Enable people filtering for delegations
                        />
                    </div>
                    <div className="shrink-0">
                        <TimelineControls
                            onTodayClick={handleTodayClick}
                            onGoToFirst={handleGoToFirst}
                            showGoToFirst={taskFilters.length > 0 || projectFilters.length > 0 || colleagueFilters.length > 0}
                            scale={scale}
                            onScaleClick={() => controlsRef.current?.setShowCustomScale?.(true)}
                        />
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-full gap-8">

                {/* Timeline View - Duplicated User Row */}
                <div className="shrink-0">
                    <DashboardTimeline
                        initialTasks={myTasks}
                        setTasks={setTasks}
                        user={user}
                        refetchTasks={refetchTasks}
                        scale={scale}
                        setScale={setScale}
                        controlsRef={controlsRef}
                        onDateScroll={(d) => {
                            if (dayViewControlsRef.current.scrollToDate) {
                                dayViewControlsRef.current.scrollToDate(d);
                            }
                        }}
                        showDoneTasks={showDoneTasks}
                        toggleShowDoneTasks={() => setShowDoneTasks(prev => !prev)}
                    />
                </div>


                {/* NEW: Detailed Day View */}
                <div className="shrink-0">
                    <TimelineRegistryProvider>
                        <DetailedTaskDayView
                            ref={dayViewControlsRef}
                            tasks={myTasks}
                        // We could pass selectedDate if we had one from context/timeline click
                        />
                    </TimelineRegistryProvider>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0 pb-8">

                    {/* My Priorities Column */}
                    <TaskColumn
                        title="My Priorities"
                        count={myTasks.length}
                        tasks={myTasks}
                        loading={tasksLoading}
                        emptyMessage="No pending tasks"
                        headerColorClass="bg-teal-100 text-teal-700"
                    />

                    {/* Delegated Tasks Column */}
                    <TaskColumn
                        title="Delegated Tasks"
                        count={delegatedTasks.length}
                        tasks={delegatedTasks}
                        loading={tasksLoading}
                        emptyMessage="No active delegations"
                        colleagues={colleagues}
                        isDelegated={true}
                        headerColorClass="bg-indigo-100 text-indigo-700"
                        headerExtra={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking</span>}
                    />
                </div>
            </div>
        </PageLayout>
    );
};

export default MyDashboard;
