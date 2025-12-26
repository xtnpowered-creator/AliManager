import React, { useCallback } from 'react';
import { useTimelineActions } from '../../hooks/timeline/useTimelineActions';
import { useToast } from '../../context/ToastContext';
import UnifiedTimelineBoard from '../UnifiedTimelineBoard';
import { TimelineRegistryProvider } from '../../context/TimelineRegistryContext';
import { useTimelineDateRange } from '../../hooks/useTimelineDateRange';

const DashboardTimeline = ({ initialTasks, user, refetchTasks, setTasks, scale, setScale, controlsRef, onDateScroll, showDoneTasks, toggleShowDoneTasks }) => {
    const { showToast } = useToast();

    // 1. Time Logic (Shared)
    const days = useTimelineDateRange();

    // 2. Shared Actions Logic (Replaces local implementations)
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

    // Adapter for UnifiedBoard to get tasks
    // Match the logic from useTimelineState's getTasksForColleague
    const getTasksAdapter = useCallback((colleagueId) => {
        return initialTasks.filter(t => {
            // 1. Explicit Assignment (assignedTo is an array)
            if (t.assignedTo && t.assignedTo.includes(colleagueId)) return true;

            // 2. Unassigned Fallback (Treat as Self-Assigned to Creator)
            const isUnassigned = !t.assignedTo || t.assignedTo.length === 0;
            if (isUnassigned && t.createdBy === colleagueId) return true;

            return false;
        });
    }, [initialTasks]);

    if (!user) return null;

    return (
        <div className="flex flex-col rounded-2xl bg-white overflow-hidden select-none relative h-auto">
            {/* Unified Board handles everything inside */}
            <TimelineRegistryProvider>
                <UnifiedTimelineBoard
                    user={user}
                    colleagues={[user]} // Just Me
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

                    onDateScroll={onDateScroll} // Pass Prop

                    showSidebar={false}
                    viewOffset={0} // No sidebar offset
                    headerContent={null} // No extra header, just the board (Today button overlays)

                    controlsRef={controlsRef}

                    // Delegation (Not applicable for simplified dashboard usually, but passed safely)
                    delegationMap={new Map()}
                    showDoneTasks={showDoneTasks}
                    toggleShowDoneTasks={toggleShowDoneTasks}
                />
            </TimelineRegistryProvider>
        </div>
    );
};

export default DashboardTimeline;
