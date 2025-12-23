import { useState, useMemo } from 'react';

export const useFilterAndSortTool = (tasks, colleagues, projectsData, user) => {
    // -- State --
    const [searchText, setSearchText] = useState('');
    const [colleagueFilters, setColleagueFilters] = useState([]); // [{ type, value }]
    const [taskFilters, setTaskFilters] = useState([]);       // [{ type, value }]
    const [projectFilters, setProjectFilters] = useState([]); // [{ type, value }]
    const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
    const [hideEmptyRows, setHideEmptyRows] = useState(false);

    // -- 1. Filter Tasks (What) --
    // Applies strict task filters AND fuzzy search text
    const filteredTasks = useMemo(() => {
        let result = tasks;

        // A. Project Filters (Scope down tasks based on their Project)
        if (projectFilters.length > 0) {
            const projectMap = new Map((projectsData || []).map(p => [p.id, p]));
            result = result.filter(task => {
                if (!task.projectId) return false; // Tasks with no project cannot match project filters
                const proj = projectMap.get(task.projectId);
                if (!proj) return false;

                return projectFilters.every(f => {
                    if (f.type === 'client') return proj.client?.toLowerCase() === f.value.toLowerCase();
                    if (f.type === 'status') return proj.status?.toLowerCase() === f.value.toLowerCase();
                    if (f.type === 'title') return proj.title === f.value; // Exact match for project name
                    return true;
                });
            });
        }

        // B. Task Filters
        if (taskFilters.length > 0) {
            result = result.filter(task => {
                return taskFilters.every(f => {
                    if (f.type === 'status') return task.status?.toLowerCase() === f.value.toLowerCase();
                    if (f.type === 'priority') return task.priority?.toLowerCase() === f.value.toLowerCase();
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
    // Applies structured filters to the roster
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

    const resetAll = () => {
        setSearchText('');
        setColleagueFilters([]);
        setTaskFilters([]);
        setProjectFilters([]);
        setSortConfig({ field: 'name', direction: 'asc' });
        setHideEmptyRows(false);
    };


    // -- 3. Assemble & Sort View --
    const visibleColleagues = useMemo(() => {
        if (!user) return [];

        // A. Identify "Me"
        const selfId = user.id || user.uid;
        const self = colleagues.find(c => c.id === selfId) || { id: selfId, name: 'Me', avatar: 'M' };

        let others = candidateColleagues.filter(c => c.id !== selfId);

        // C. Prune Empty Rows (if enabled)
        if (hideEmptyRows) {
            const activeUserIds = new Set();
            filteredTasks.forEach(t => t.assignedTo?.forEach(uid => activeUserIds.add(uid)));
            others = others.filter(c => activeUserIds.has(c.id));
        }

        // D. Sort
        others.sort((a, b) => {
            if (sortConfig.field === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            if (sortConfig.field === 'position') {
                return (a.position || '').localeCompare(b.position || '');
            }
            if (sortConfig.field === 'taskCount') {
                const countA = filteredTasks.filter(t => t.assignedTo?.includes(a.id)).length;
                const countB = filteredTasks.filter(t => t.assignedTo?.includes(b.id)).length;
                return countB - countA; // Descending
            }
            return 0;
        });

        // E. Return [Me, ...Others]
        // "Me" is always pinned (User Rule)
        return [self, ...others];

    }, [candidateColleagues, filteredTasks, user, hideEmptyRows, sortConfig, colleagues, searchText]);

    return {
        // State
        searchText, setSearchText,
        colleagueFilters, setColleagueFilters,
        taskFilters, setTaskFilters,
        projectFilters, setProjectFilters,
        sortConfig, setSortConfig,
        hideEmptyRows, setHideEmptyRows,
        resetAll,

        // Results
        filteredTasks,
        visibleColleagues
    };
};
