import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useTimelineSelection } from '../../hooks/useTimelineSelection';
import { useTimelineActions } from '../../hooks/timeline/useTimelineActions';
import { apiClient } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import UnifiedTimelineBoard from '../UnifiedTimelineBoard';

const DashboardTimeline = ({ initialTasks, user, refetchTasks, setTasks, scale, setScale, controlsRef }) => {
    const { showToast } = useToast();

    // 1. Time Logic (Passed to UnifiedBoard)
    const days = useMemo(() => {
        const result = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 30); // 30 days back
        for (let i = 0; i < 90; i++) { // 3 months total
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            result.push(date);
        }
        return result;
    }, []);

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
    const getTasksAdapter = useCallback((colleagueId) => {
        return initialTasks;
    }, [initialTasks]);

    if (!user) return null;

    return (
        <div className="flex flex-col rounded-2xl bg-white overflow-hidden select-none relative h-auto">
            {/* Unified Board handles everything inside */}
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

                showSidebar={false}
                viewOffset={0} // No sidebar offset
                headerContent={null} // No extra header, just the board (Today button overlays)

                controlsRef={controlsRef}

                // Delegation (Not applicable for simplified dashboard usually, but passed safely)
                delegationMap={new Map()}
            />
        </div>
    );
};

export default DashboardTimeline;
