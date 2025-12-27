import { useFilterPersistence } from './useFilterPersistence';
import { useFilterLogic } from './useFilterLogic';

/**
 * useFilterAndSortTool Hook
 * 
 * Orchestrates filtering and sorting functionality for timeline/list views.
 * Combines persistence (localStorage) and filtering logic into single interface.
 * 
 * Architecture (2-layer composition):
 * 1. useFilterPersistence: State management + localStorage sync
 * 2. useFilterLogic: Applies filters to data, returns filtered results
 * 
 * Why Split?
 * - Separation of concerns (persistence vs business logic)
 * - Easier testing (logic can be tested without localStorage)
 * - Reusability (logic can be used with different state sources)
 * 
 * Filter Types:
 * - searchText: Global text search across all fields
 * - colleagueFilters: Department, position, etc.
 * - taskFilters: Status, priority, due date, content
 * - projectFilters: Client, status, title
 * - sortConfig: Column to sort by + direction
 * - hideEmptyRows: Collapse colleagues with no visible tasks
 * 
 * Persistence:
 * - All filter state saved to localStorage per user
 * - Restored on mount (preserves user's filter preferences)
 * - Debounced writes (prevents excessive I/O)
 * 
 * Usage:
 * ```js
 * const {
 *   filteredTasks,
 *   visibleColleagues,
 *   setTaskFilters,
 *   resetAll
 * } = useFilterAndSortTool(tasks, colleagues, projectsData, user);
 * ```
 * 
 * @param {Array} tasks - All tasks
 * @param {Array} colleagues - All colleagues
 * @param {Array} projectsData - All projects
 * @param {Object} user - Current user (for persistence key)
 * @returns {Object} Filter state, filtered data, and actions
 */
export const useFilterAndSortTool = (tasks, colleagues, projectsData, user) => {

    // 1. Manage State & Persistence
    const { state, setters } = useFilterPersistence(user);

    // 2. Execute Filtering Logic
    const { filteredTasks, visibleColleagues } = useFilterLogic({
        tasks,
        colleagues,
        projectsData,
        user,
        filters: state
    });

    // 3. Return Combined Interface
    return {
        // State (current filter values)
        searchText: state.searchText,
        colleagueFilters: state.colleagueFilters,
        taskFilters: state.taskFilters,
        projectFilters: state.projectFilters,
        sortConfig: state.sortConfig,
        hideEmptyRows: state.hideEmptyRows,

        // Results (filtered data)
        filteredTasks,
        visibleColleagues,

        // Actions (state setters)
        setSearchText: setters.setSearchText,
        setColleagueFilters: setters.setColleagueFilters,
        setTaskFilters: setters.setTaskFilters,
        setProjectFilters: setters.setProjectFilters,
        setSortConfig: setters.setSortConfig,
        setHideEmptyRows: setters.setHideEmptyRows,
        resetAll: setters.resetAll
    };
};
