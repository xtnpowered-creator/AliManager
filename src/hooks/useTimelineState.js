import { useCallback, useState } from 'react';
import { useTimelineData } from './timeline/useTimelineData';
import { useTimelineActions } from './timeline/useTimelineActions';
import { useFilterAndSortTool } from './useFilterAndSortTool';

/**
 * useTimelineState Hook
 * 
 * Central state aggregator for timeline views. Combines data fetching, filtering,
 * sorting, and actions into a single interface. This is the primary hook consumed
 * by timeline-style components (UnifiedTimelineBoard, DashboardTimeline).
 * 
 * Architecture (4 Layers):
 * 
 * 1. Data Fetching Layer (useTimelineData):
 *    - Fetches tasks, colleagues, projects, delegations from API
 *    - Manages loading states
 *    - Provides refetch capabilities
 * 
 * 2. Filtering & Sorting Layer (useFilterAndSortTool):
 *    - Applies search text, colleague filters, task filters, project filters
 *    - Manages filter state persistence (localStorage per-user)
 *    - Returns filteredTasks and visibleColleagues
 * 
 * 3. Actions Layer (useTimelineActions):
 *    - Provides task mutation methods (update, delete, move date, bulk ops)
 *    - Manages delegation (revoke, update)
 *    - Handles optimistic updates
 * 
 * 4. Computed Helpers Layer:
 *    - getTasksForColleague: Returns filtered tasks for a specific colleague
 *    - Applies assignment logic and done task toggle
 * 
 * Task Assignment Logic (in getTasksForColleague):
 * - Explicit assignment: Task's assignedTo array includes colleagueId
 * - Implicit assignment: Unassigned tasks default to creator (createdBy === colleagueId)
 * - Done toggle: Respects showDoneTasks state
 * 
 * @param {Object} user - Current user object (for filtering persistence key)
 * @returns {Object} Comprehensive timeline state and controls
 */
export const useTimelineState = (user) => {
    // 0. UI State
    const [showDoneTasks, setShowDoneTasks] = useState(true);

    // 1. Data Fetching Layer
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

    // 2. Filtering & Sorting Layer
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

    // 3. Actions Layer
    // Actions receive tasks array to look up task details for API calls
    const {
        handleRevokeDelegation,
        handleUpdateTask,
        handleDeleteTasks,
        handleBulkUpdate,
        handleMoveDate
    } = useTimelineActions({ tasks, setTasks, refetchTasks, setDelegations });

    // 4. Computed Helpers Layer
    /**
     * Returns tasks for a specific colleague, applying assignment logic and done toggle.
     * 
     * Assignment Rules:
     * 1. Done toggle: Filter out done tasks if showDoneTasks=false
     * 2. Explicit assignment: Task assignedTo includes colleagueId
     * 3. Unassigned fallback: Tasks with no assignedTo default to creator
     * 
     * @param {string} colleagueId - Colleague ID to filter tasks for
     * @returns {Array<Object>} Filtered task array
     */
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
        showDoneTasks, setShowDoneTasks,

        // Computed Results
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
