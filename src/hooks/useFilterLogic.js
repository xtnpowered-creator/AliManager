import { useMemo } from 'react';

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
