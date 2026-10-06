import { useAuth } from '../context/AuthContext';
import { useFilterAndSortTool } from './useFilterAndSortTool';

export const useBoardFilters = (tasks, colleagues, projects) => {
    const { user } = useAuth();
    const filters = useFilterAndSortTool(tasks, colleagues, projects, user);
    const visibleIds = new Set(colleagues.filter(person => filters.colleagueFilters.every(filter =>
        String(person[filter.type] || '').toLowerCase() === filter.value.toLowerCase())).map(person => person.id));
    const visibleTasks = filters.filteredTasks.filter(task => !filters.colleagueFilters.length ||
        task.assignedTo?.some(id => visibleIds.has(id)) ||
        (!task.assignedTo?.length && visibleIds.has(task.createdBy)));
    return { ...filters, visibleTasks, hasFilters: Boolean(filters.taskFilters.length || filters.projectFilters.length || filters.colleagueFilters.length) };
};
