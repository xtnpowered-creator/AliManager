import { useCallback } from 'react';
import { useTimelineData } from './timeline/useTimelineData';
import { useTimelineFilters } from './timeline/useTimelineFilters';
import { useTimelineActions } from './timeline/useTimelineActions';

export const useTimelineState = (user) => {
    // 1. Data Fetching
    const {
        tasks,
        setTasks,
        refetchTasks,
        colleagues,
        projectsData,
        loading,
        delegations,
        setDelegations,
        delegationMap
    } = useTimelineData(user);

    // 2. Filters & Computed Lists
    const {
        filterText,
        setFilterText,
        filteredTasks,
        visibleColleagues
    } = useTimelineFilters(tasks, colleagues, projectsData, user);

    // 3. Actions
    // Pass 'tasks' so actions can look up task details for API calls
    const {
        handleRevokeDelegation,
        handleUpdateTask,
        handleDeleteTasks,
        handleBulkUpdate,
        handleMoveDate
    } = useTimelineActions({ tasks, setTasks, refetchTasks, setDelegations });

    // 4. Adapters & Helpers
    const getTasksForColleague = useCallback((colleagueId) =>
        filteredTasks.filter(t => t.assignedTo?.includes(colleagueId)),
        [filteredTasks]);

    return {
        // Data
        tasks,
        colleagues,
        projectsData,
        delegationMap,
        loading,

        // Filter State
        filterText,
        setFilterText,
        visibleColleagues,
        filteredTasks,

        // Actions
        refetchTasks,
        handleRevokeDelegation,
        handleUpdateTask,
        handleDeleteTasks,
        handleBulkUpdate,
        handleMoveDate,
        setDelegations,

        // Helpers
        getTasksForColleague
    };
};
