import { useCallback, useState } from 'react';
import { useTimelineData } from './timeline/useTimelineData';

import { useTimelineActions } from './timeline/useTimelineActions';
import { useFilterAndSortTool } from './useFilterAndSortTool';

export const useTimelineState = (user) => {
    // 0. UI State
    const [showDoneTasks, setShowDoneTasks] = useState(true);

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
        searchText, setSearchText,
        colleagueFilters, setColleagueFilters,
        taskFilters, setTaskFilters,
        sortConfig, setSortConfig,
        hideEmptyRows, setHideEmptyRows,
        resetAll,
        projectFilters, setProjectFilters,
        filteredTasks,
        visibleColleagues
    } = useFilterAndSortTool(tasks, colleagues, projectsData, user);

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
        filteredTasks.filter(t => {
            // 0. Done Toggle Check
            if (t.status === 'done' && !showDoneTasks) return false;

            // 1. Explicit Assignment
            if (t.assignedTo && t.assignedTo.includes(colleagueId)) return true;

            // 2. Unassigned Fallback (Treat as Self-Assigned to Creator)
            const isUnassigned = !t.assignedTo || t.assignedTo.length === 0;
            if (isUnassigned && t.createdBy === colleagueId) return true;

            return false;
        }),
        [filteredTasks, showDoneTasks]);

    return {
        // Data
        tasks,
        colleagues,
        projectsData,
        delegationMap,
        loading,

        // Filter State
        searchText, setSearchText,
        colleagueFilters, setColleagueFilters,
        taskFilters, setTaskFilters,
        projectFilters, setProjectFilters,
        sortConfig, setSortConfig,
        hideEmptyRows, setHideEmptyRows,
        resetAll,
        showDoneTasks, setShowDoneTasks, // Exposed

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
