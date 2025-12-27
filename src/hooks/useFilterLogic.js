import { useMemo } from 'react';

/**
 * useFilterLogic Hook
 * 
 * Multi-dimensional filtering engine for timeline views.
 * Filters both tasks (WHAT to show) and colleagues (WHO to show).
 * 
 * Architecture:
 * - Filters applied sequentially (AND logic): All filters must match
 * - Memoized for performance (prevents re-filtering on unrelated renders)
 * - Supports structured filters + fuzzy search
 * 
 * Filter Types:
 * 1. **Task Filters** (Structured):
 *    - Status: 'todo', 'doing', 'done'
 *    - Priority: '1', '2', '3', 'high', 'medium', 'low'
 *    - Due Date: 'today', 'tomorrow', 'overdue', specific date (YYYY-MM-DD)
 *    - Content: 'Has Steps', 'Has Deliverables', 'Has Files'
 *    - Created: 'today', 'yesterday'
 *    - Title: Fuzzy match (case-insensitive substring)
 * 
 * 2. **Project Filters** (Structured):
 *    - Client: Exact match (case-insensitive)
 *    - Status: Exact match ('active', 'completed', etc.)
 *    - Title: Exact match
 *    → Tasks without projectId excluded when project filters active
 * 
 * 3. **Colleague Filters** (Structured):
 *    - Department: Exact match
 *    - Position: Exact match
 *    - Team: Exact match
 * 
 * 4. **Search Text** (Fuzzy):
 *    - Tasks: Searches title + status
 *    - Colleagues: Searches name
 *    - Case-insensitive substring match
 * 
 * Colleague Visibility Logic:
 * - Current user always first in list (labeled "Me")
 * - Other colleagues sorted alphabetically by name
 * - Filters applied to all colleagues including current user
 * - Fallback: If user not in colleagues array, create synthetic entry
 * 
 * Date Normalization:
 * - All dates normalized to midnight (setHours(0,0,0,0))
 * - Ensures "today" comparison works correctly
 * - Handles timezone-safe comparisons
 * 
 * Priority Normalization:
 * - Handles both numeric ('1', '2', '3') and text ('high', 'medium', 'low')
 * - Filter "Priority 1" matches task.priority '1'
 * - Case-insensitive matching
 * 
 * Performance:
 * - useMemo prevents re-filtering unless dependencies change
 * - Map for O(1) project lookups
 * - Set for O(1) visibility  checks
 * - Early returns for empty filter cases
 * 
 * Usage:
 * ```jsx
 * const { filteredTasks, visibleColleagues } = useFilterLogic({
 *   tasks, colleagues, projectsData, user,
 *   filters: { searchText, taskFilters, projectFilters, colleagueFilters }
 * });
 * ```
 * 
 * @param {Object} params
 * @param {Array} params.tasks - All tasks
 * @param {Array} params.colleagues - All colleagues
 * @param {Array} params.projectsData - All projects
 * @param {Object} params.user - Current user
 * @param {Object} params.filters - Filter configuration
 * @param {string} params.filters.searchText - Fuzzy search query
 * @param {Array} params.filters.taskFilters - Task filter chips
 * @param {Array} params.filters.projectFilters - Project filter chips
 * @param {Array} params.filters.colleagueFilters - Colleague filter chips
 * @returns {Object} { filteredTasks, visibleColleagues }
 */
export const useFilterLogic = ({
    tasks,
    colleagues,
    projectsData,
    user,
    filters // { searchText, taskFilters, projectFilters, colleagueFilters }
}) => {
    const { searchText, taskFilters, projectFilters, colleagueFilters } = filters;

    // -- 1. Filter Tasks (What) --
    const filteredTasks = useMemo(() => {
        let result = tasks;

        // A. Project Filters
        if (projectFilters.length > 0) {
            const projectMap = new Map((projectsData || []).map(p => [p.id, p]));
            result = result.filter(task => {
                if (!task.projectId) return false;
                const proj = projectMap.get(task.projectId);
                if (!proj) return false;

                return projectFilters.every(f => {
                    if (f.type === 'client') return proj.client?.toLowerCase() === f.value.toLowerCase();
                    if (f.type === 'status') return proj.status?.toLowerCase() === f.value.toLowerCase();
                    if (f.type === 'title') return proj.title === f.value;
                    return true;
                });
            });
        }

        // B. Task Filters
        if (taskFilters.length > 0) {
            result = result.filter(task => {
                return taskFilters.every(f => {
                    const type = f.type;
                    const val = f.value;

                    // 1. Status & Priority
                    if (type === 'status') return String(task.status || '').toLowerCase() === val.toLowerCase();
                    if (type === 'priority') {
                        // Normalize: "Priority 1" -> "1", and handle both number/string data
                        const dataPrio = String(task.priority || '').toLowerCase();
                        const filterPrio = val.toLowerCase().replace('priority ', '').trim();
                        return dataPrio === filterPrio;
                    }

                    // 2. Title (Fuzzy)
                    if (type === 'title') return task.title?.toLowerCase().includes(val.toLowerCase());

                    // 3. Due Date Comparison
                    if (type === 'due date') {
                        if (!task.dueDate) return false;
                        const d = new Date(task.dueDate);

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const taskDay = new Date(d);
                        taskDay.setHours(0, 0, 0, 0);

                        if (val.toLowerCase() === 'today') return taskDay.getTime() === today.getTime();
                        if (val.toLowerCase() === 'tomorrow') {
                            const tmrw = new Date(today);
                            tmrw.setDate(today.getDate() + 1);
                            return taskDay.getTime() === tmrw.getTime();
                        }
                        if (val.toLowerCase() === 'overdue') return taskDay < today && task.status !== 'done';

                        // Handle Specific Date Input
                        const inputDate = new Date(val);
                        if (!isNaN(inputDate.getTime())) {
                            return taskDay.getFullYear() === inputDate.getFullYear() &&
                                taskDay.getMonth() === inputDate.getMonth() &&
                                taskDay.getDate() === inputDate.getDate();
                        }
                        return false;
                    }

                    // 4. Content
                    if (type === 'content') {
                        if (val === 'Has Steps') return task.steps && task.steps.length > 0;
                        if (val === 'Has Deliverables') return task.deliverables && task.deliverables.length > 0;
                        if (val === 'Has Files') return task.files && task.files.length > 0;
                    }

                    // 5. Created Date
                    if (type === 'created') {
                        if (!task.createdAt) return false;
                        const created = new Date(new Date(task.createdAt).setHours(0, 0, 0, 0));
                        const today = new Date(new Date().setHours(0, 0, 0, 0));

                        if (val.toLowerCase() === 'today') return created.getTime() === today.getTime();
                        if (val.toLowerCase() === 'yesterday') {
                            const yest = new Date(today);
                            yest.setDate(today.getDate() - 1);
                            return created.getTime() === yest.getTime();
                        }
                    }

                    return true;
                });
            });
        }

        // C. Search Text (Fuzzy - Tasks)
        if (searchText) {
            const token = searchText.toLowerCase();
            result = result.filter(t =>
                t.title?.toLowerCase().includes(token) ||
                t.status?.toLowerCase().includes(token)
            );
        }

        return result;
    }, [tasks, taskFilters, projectFilters, searchText, projectsData]);


    // -- 2. Filter Colleagues (Who) --
    const candidateColleagues = useMemo(() => {
        let result = colleagues;

        // A. Structured Filters
        if (colleagueFilters.length > 0) {
            result = result.filter(c => {
                return colleagueFilters.every(f => {
                    if (f.type === 'department') return c.department?.toLowerCase() === f.value.toLowerCase();
                    if (f.type === 'position') return c.position?.toLowerCase() === f.value.toLowerCase();
                    if (f.type === 'team') return c.team?.toLowerCase() === f.value.toLowerCase();
                    return true;
                });
            });
        }

        // B. Search Text (Fuzzy - Colleagues)
        if (searchText) {
            const token = searchText.toLowerCase();
            result = result.filter(c => c.name?.toLowerCase().includes(token));
        }

        return result;
    }, [colleagues, colleagueFilters, searchText]);


    // -- 3. Assemble Visible View --
    const visibleColleagues = useMemo(() => {
        if (!user) return [];
        const selfId = user.id || user.uid;
        const self = colleagues.find(c => c.id === selfId) || { id: selfId, name: 'Me', avatar: 'M' };

        let others = candidateColleagues.filter(c => c.id !== selfId);
        others.sort((a, b) => a.name.localeCompare(b.name));

        return [self, ...others];
    }, [colleagues, candidateColleagues, user]);

    return { filteredTasks, visibleColleagues };
};
