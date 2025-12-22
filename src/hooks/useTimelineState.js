import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApiData } from '../hooks/useApiData';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

export const useTimelineState = (user) => {
    const { showToast } = useToast();
    const { data: tasks = [], loading: loadingTasks, refetch: refetchTasks, setData: setTasks } = useApiData('/tasks');
    const { data: colleagues = [], loading: loadingColleagues } = useApiData('/colleagues');
    const { data: projectsData = [], loading: loadingProjects } = useApiData('/projects');

    const loading = loadingTasks || loadingColleagues || loadingProjects;

    const [filterText, setFilterText] = useState('');
    const [orderedColleagues, setOrderedColleagues] = useState([]);
    const [delegations, setDelegations] = useState([]);

    // Fetch Delegations if Admin
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'god')) {
            apiClient.get('/delegations')
                .then(setDelegations)
                .catch(err => console.error('Failed to fetch delegations:', err));
        }
    }, [user]);

    const handleRevokeDelegation = useCallback(async (delegationId) => {
        if (confirm('Are you sure you want to revoke admin access?')) {
            try {
                await apiClient.delete(`/delegations/${delegationId}`);
                const res = await apiClient.get('/delegations');
                setDelegations(res);
            } catch (err) {
                console.error('Revoke failed:', err);
                showToast('Failed to revoke.', 'error');
            }
        }
    }, []);

    const delegationMap = useMemo(() => new Map(delegations.map(d => [d.delegate_id, d])), [delegations]);

    // Sync colleagues with local storage order
    useEffect(() => {
        if (colleagues.length === 0) return;
        const savedOrder = JSON.parse(localStorage.getItem('colleagueOrder') || '[]');
        const colleagueMap = new Map(colleagues.map(c => [c.id, c]));
        const newOrder = [];
        const seenIds = new Set();

        savedOrder.forEach(id => {
            if (colleagueMap.has(id)) {
                newOrder.push(colleagueMap.get(id));
                seenIds.add(id);
            }
        });

        colleagues.forEach(c => {
            if (!seenIds.has(c.id)) newOrder.push(c);
        });

        // Default: Move Alisara to top if no order saved
        if (savedOrder.length === 0) {
            const alisaraIndex = newOrder.findIndex(c => c.name === 'Alisara Plyler');
            if (alisaraIndex > 0) {
                const [alisara] = newOrder.splice(alisaraIndex, 1);
                newOrder.unshift(alisara);
            }
        }
        setOrderedColleagues(newOrder);
    }, [colleagues]);

    // Filters & Visibility
    const filteredTasks = useMemo(() => {
        if (!filterText) return tasks;
        const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        const projectMap = new Map((projectsData || []).map(p => [p.id, p.title?.toLowerCase() || '']));
        const colleagueMap = new Map((colleagues || []).map(c => [c.id, c.name?.toLowerCase() || '']));

        return tasks.filter(t => tokens.every(token => {
            return t.title?.toLowerCase().includes(token) ||
                (t.projectId && projectMap.get(t.projectId)?.includes(token)) ||
                t.priority?.toLowerCase().includes(token) ||
                t.assignedTo?.some(uid => colleagueMap.get(uid)?.includes(token));
        }));
    }, [tasks, filterText, projectsData, colleagues]);

    const visibleColleagues = useMemo(() => {
        let list = orderedColleagues;
        if (filterText) {
            const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            const activeIds = new Set();
            filteredTasks.forEach(t => t.assignedTo?.forEach(uid => activeIds.add(uid)));
            list = orderedColleagues.filter(c => activeIds.has(c.id) || tokens.every(token => c.name?.toLowerCase().includes(token)));
        }

        // PINNED USER LOGIC: Always keep the logged-in person at the very top row
        if (user) {
            const selfId = user.id || user.uid;
            const self = list.find(c => c.id === selfId) ||
                (colleagues || []).find(c => c.id === selfId) ||
                { id: selfId, name: user.displayName || 'Me', avatar: 'M' };
            return [self, ...list.filter(c => c.id !== selfId)];
        }
        return list;
    }, [orderedColleagues, filteredTasks, filterText, user, colleagues]);

    const handleUpdateTask = useCallback(async (taskId, updates) => {
        try {
            await apiClient.patch(`/tasks/${taskId}`, updates);
            refetchTasks();
            showToast('Task updated', 'success');
        } catch (err) {
            console.error('Failed to update task:', err);
            showToast('Failed to update task', 'error');
        }
    }, [refetchTasks, showToast]);

    const handleDeleteTasks = useCallback(async (taskIds) => {
        if (!taskIds || taskIds.size === 0) return false;

        // 1. Optimistic Update
        const idsToDelete = Array.from(taskIds);
        setTasks(prev => prev.filter(t => !idsToDelete.includes(t.id)));

        try {
            const promises = idsToDelete.map(id => apiClient.delete(`/tasks/${id}`));
            await Promise.all(promises);

            const count = taskIds.size;
            showToast(`Deleted ${count > 1 ? `${count} tasks` : 'task'}`, 'success');
            return true;
        } catch (err) {
            console.error('Delete failed:', err);
            showToast(`Failed to delete: ${err.message}`, 'error');
            refetchTasks(); // Revert
            return false;
        }
    }, [refetchTasks, showToast, setTasks]);

    const handleBulkUpdate = useCallback(async (selectedTaskIds, updates) => {
        const ids = Array.from(selectedTaskIds);

        // 1. Optimistic Update
        setTasks(prev => prev.map(t => {
            if (ids.includes(t.id)) {
                const newT = { ...t, ...updates };
                // Handle completedAt logic for immediate UI feedback (location in timeline)
                if (updates.status === 'done') {
                    newT.completedAt = new Date().toISOString();
                } else if (updates.status) {
                    newT.completedAt = null; // Clear if moving out of done
                }
                return newT;
            }
            return t;
        }));

        try {
            const promises = ids.map(taskId => apiClient.patch(`/tasks/${taskId}`, updates));
            await Promise.all(promises);

            const count = ids.length;
            const taskLabel = count > 1 ? `${count} Tasks` : '1 Task';

            if (updates.dueDate) {
                showToast(`Rescheduled (${taskLabel})`, 'success');
            } else if (updates.assignedTo) {
                showToast(`Reassigned (${taskLabel})`, 'success');
            } else if (updates.status) {
                showToast(`Marked as ${updates.status} (${taskLabel})`, 'success');
            } else if (updates.priority) {
                showToast(`Priority set to ${updates.priority || 'None'} (${taskLabel})`, 'success');
            } else {
                showToast(`Updated (${taskLabel})`, 'success');
            }
            refetchTasks(); // Force refresh to ensure consistency
        } catch (err) {
            console.error('Bulk update failed:', err);
            showToast('Some updates failed', 'error');
            refetchTasks(); // Revert
        }
    }, [refetchTasks, showToast, setTasks]);

    const handleMoveDate = useCallback(async (taskIds, days, direction) => {
        if (!taskIds || taskIds.length === 0 || !days) return;

        // 1. Optimistic Update (Immediate Feedback)
        setTasks(prevTasks => prevTasks.map(t => {
            if (taskIds.includes(t.id) && t.dueDate) {
                const newDate = new Date(t.dueDate);
                const shift = direction === 'later' ? days : -days;
                newDate.setDate(newDate.getDate() + shift);
                return { ...t, dueDate: newDate.toISOString() };
            }
            return t;
        }));

        // 2. API Call (Background)
        try {
            const promises = taskIds.map(id => {
                const task = tasks.find(t => t.id === id);
                if (!task || !task.dueDate) return Promise.resolve();

                const currentDate = new Date(task.dueDate);
                const shift = direction === 'later' ? days : -days;
                currentDate.setDate(currentDate.getDate() + shift);

                return apiClient.patch(`/tasks/${id}`, {
                    dueDate: currentDate.toISOString()
                });
            });

            await Promise.all(promises);
            showToast(`Moved due dates (${taskIds.length} Tasks)`, 'success');
            // No refetch needed if optimistic update matches, but safe to do quietly
            // refetchTasks(); 
        } catch (err) {
            console.error("Failed to move dates:", err);
            showToast("Failed to update task dates", 'error');
            refetchTasks(); // Revert on error
        }
    }, [tasks, setTasks, showToast, refetchTasks]);

    const getTasksForColleague = useCallback((colleagueId) =>
        filteredTasks.filter(t => t.assignedTo?.includes(colleagueId)),
        [filteredTasks]);

    return {
        tasks,
        refetchTasks,
        colleagues,
        projectsData,
        filterText,
        setFilterText,
        visibleColleagues,
        filteredTasks,
        delegationMap,
        handleRevokeDelegation,
        handleUpdateTask,
        handleBulkUpdate,
        handleMoveDate, // EXPORT
        handleDeleteTasks,
        getTasksForColleague,
        setDelegations,
        loading
    };
};
