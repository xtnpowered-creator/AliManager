import { useFilterPersistence } from './useFilterPersistence';
import { useFilterLogic } from './useFilterLogic';

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
        // State
        searchText: state.searchText,
        colleagueFilters: state.colleagueFilters,
        taskFilters: state.taskFilters,
        projectFilters: state.projectFilters,
        sortConfig: state.sortConfig,
        hideEmptyRows: state.hideEmptyRows,

        // Results
        filteredTasks,
        visibleColleagues,

        // Actions
        setSearchText: setters.setSearchText,
        setColleagueFilters: setters.setColleagueFilters,
        setTaskFilters: setters.setTaskFilters,
        setProjectFilters: setters.setProjectFilters,
        setSortConfig: setters.setSortConfig,
        setHideEmptyRows: setters.setHideEmptyRows,
        resetAll: setters.resetAll
    };
};
