import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Calendar, Shield } from 'lucide-react';
import FilterAndSortToolbar from '../components/shared/filters/FilterAndSortToolbar';
import { useAuth } from '../context/AuthContext';
import { useTimelineState } from '../hooks/useTimelineState';
import TimelineSkeleton from '../components/TimelineSkeleton';
import TimelineControls from '../components/TimelineControls';
import UnifiedTimelineBoard from '../components/UnifiedTimelineBoard';
import { TimelineRegistryProvider } from '../context/TimelineRegistryContext';

const TimelineView = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const highlightTaskId = searchParams.get('highlightTaskId');
    const { user } = useAuth();

    // -- State Hooks --
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
        loading
    } = useTimelineState(user);

    const [scale, setScale] = useState(10); // Days visible

    // Date Logic (Shared? UnifiedBoard calculates internal Days?)
    // UnifiedBoard uses days prop. We calculate it here or let it handle?
    // Let's calculate here to keep control.
    const days = React.useMemo(() => {
        const result = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 30);
        for (let i = 0; i < 90; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            result.push(d);
        }
        return result;
    }, []);

    const isToday = (d) => {
        const t = new Date(); t.setHours(0, 0, 0, 0);
        return d.getTime() === t.getTime();
    };

    // Listen for Today Event (Hack for button in header accessing ref in child)
    // Alternatively, pass a ref to UnifiedBoard? No, board has internal ref.
    // Pass a "triggerScrollToDate" prop?
    // UnifiedBoard exposes 'scrollToDate'. Ideally via Ref.
    // Let's skip the Button Logic for a second and just rely on the UnifiedBoard's internal overlay if prop is missing?
    // No, design requirement: Header has button.
    // Let's use a MutableRefObject passed DOWN.
    const controlsRef = React.useRef({});

    // Button above:
    const handleTodayClick = () => {
        if (controlsRef.current.scrollToDate) {
            controlsRef.current.scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)));
        }
    };

    const handleGoToFirst = () => {
        if (!filteredTasks || filteredTasks.length === 0) return;

        // Helper to get effective date
        const getEffectiveDate = (t) => {
            if (t.status === 'done' && t.completedAt) return new Date(t.completedAt);
            if (t.dueDate) return new Date(t.dueDate);
            return null;
        };

        // Find task with earliest valid date
        // AND ensure it is visible (assigned to a visible colleague)
        const visibleIds = new Set(visibleColleagues.map(c => c.id));

        const validTasks = filteredTasks.filter(t => {
            // Check visibility (Matches getTasksForColleague logic)
            const hasAssignee = t.assignedTo && t.assignedTo.length > 0;
            let isVisible = false;

            if (hasAssignee) {
                isVisible = t.assignedTo.some(id => visibleIds.has(id));
            } else {
                // Unassigned -> Check if Creator corresponds to a visible row
                isVisible = visibleIds.has(t.createdBy);
            }

            if (!isVisible) return false;

            const d = getEffectiveDate(t);
            return d && !isNaN(d.getTime());
        });

        if (validTasks.length > 0) {
            // Sort by Date ASC
            validTasks.sort((a, b) => getEffectiveDate(a) - getEffectiveDate(b));

            // Scroll Pattern
            if (controlsRef.current) {
                // Find Assignment (Visual Row)
                // Use the assignment logic: 
                // If user filtered -> use that logic? 
                // The task card finds the "Row" by `assignedTo`.
                // We need to find which "Row" this task sits in.
                // If "Me" view -> My Row.
                // If "Colleagues" view -> Colleague Row.

                // NOTE: Task can be in multiple rows if multiple assignees?
                // "Go To First Match" usually implies primary assignee or first one found.
                // Let's assume the Row logic relies on the first assignee.

                // Check if Assigned to Me (Priority)
                const myId = user?.id; // user ID from context? No, prop.
                // But here we don't have user prop easily? Wait, this is TimelineView.
                // We have `user` from `useTimelineState`? No.
                // useFilterAndSortTool returns `colleagues`.

                // Standard Logic: Find first visible assignee.
                // We have `visibleColleagues` passed to Board.
                // Here `handleGoToFirst` only has `filteredTasks`.
                // We need `visibleColleagues` here? 
                // Actually `TimelineView` has `colleagues` from `useTimelineState`.

                // User Request: "I don't want any up/down scrolling... only necessary left/right"
                // So we skip the vertical alignment.

                const firstTask = validTasks[0];
                const minDate = getEffectiveDate(firstTask);

                // Align logic with handleTodayClick
                if (minDate) {
                    minDate.setHours(0, 0, 0, 0);
                    // Use scrollToDate exactly like Today button
                    if (controlsRef.current.scrollToDate) {
                        controlsRef.current.scrollToDate(minDate);
                    }
                }
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
            <div className="flex items-center gap-4 shrink-0">
                <TimelineControls
                    onTodayClick={handleTodayClick}
                    onGoToFirst={handleGoToFirst}
                    showGoToFirst={taskFilters.length > 0}
                    scale={scale}
                />
            </div>
        </header>
    );

    // Initial Load Only - Show Skeleton if we have no data yet
    // if (loading && (!tasks || tasks.length === 0)) return <TimelineSkeleton />;


    return (
        <div className="p-8 h-full flex flex-col space-y-0 overflow-hidden select-none">
            {headerWithClick}

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
                    headerContent={filterToolbar}

                    // Expose controls
                    controlsRef={controlsRef}

                    // Indicators (moved to top)

                    // Delegation
                    delegationMap={delegationMap}
                    handleRevokeDelegation={handleRevokeDelegation}
                    onDelegateConfig={setDelegations}
                />
            </TimelineRegistryProvider>
        </div>
    );
};

export default TimelineView;