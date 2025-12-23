import { useCallback } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const useTimelineActions = ({ tasks, setTasks, refetchTasks, setDelegations }) => {
    const { showToast } = useToast();

    // Revoke Admin
    const handleRevokeDelegation = useCallback(async (delegationId) => {
        if (!setDelegations) return; // Guard if not provided
        if (confirm('Are you sure you want to revoke admin access?')) {
            try {
                await apiClient.delete(`/delegations/${delegationId}`);
                const res = await apiClient.get('/delegations');
                setDelegations(res);
                showToast('Delegation revoked', 'success');
            } catch (err) {
                console.error('Revoke failed:', err);
                showToast('Failed to revoke.', 'error');
            }
        }
    }, [setDelegations, showToast]);

    // Single Update
    const handleUpdateTask = useCallback(async (taskId, updates) => {
        try {
            // Optimistic Update?
            // If we have setTasks, we can do it.
            if (setTasks) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            }

            await apiClient.patch(`/tasks/${taskId}`, updates);
            // We refetch to ensure server state (generated columns etc)
            refetchTasks();
            showToast('Task updated', 'success');
        } catch (err) {
            console.error('Failed to update task:', err);
            showToast('Failed to update task', 'error');
            refetchTasks(); // Revert
        }
    }, [refetchTasks, showToast, setTasks]);

    // Delete
    const handleDeleteTasks = useCallback(async (taskIds) => {
        if (!taskIds || taskIds.size === 0) return false;

        const idsToDelete = Array.from(taskIds);

        // Optimistic
        if (setTasks) {
            setTasks(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        }

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

    // Bulk Update
    const handleBulkUpdate = useCallback(async (selectedTaskIds, updates) => {
        const ids = Array.from(selectedTaskIds);

        // Optimistic
        if (setTasks) {
            setTasks(prev => prev.map(t => {
                if (ids.includes(t.id)) {
                    const newT = { ...t, ...updates };
                    if (updates.status === 'done') newT.completedAt = new Date().toISOString();
                    else if (updates.status) newT.completedAt = null;
                    return newT;
                }
                return t;
            }));
        }

        try {
            const promises = ids.map(taskId => apiClient.patch(`/tasks/${taskId}`, updates));
            await Promise.all(promises);
            const count = ids.length;
            showToast(`Updated ${count} tasks`, 'success');
            refetchTasks();
        } catch (err) {
            console.error('Bulk update failed:', err);
            showToast('Some updates failed', 'error');
            refetchTasks();
        }
    }, [refetchTasks, showToast, setTasks]);

    // Move Date
    const handleMoveDate = useCallback(async (taskIds, days, direction) => {
        if (!taskIds || taskIds.length === 0 || !days) return;

        // Optimistic
        if (setTasks) {
            setTasks(prevTasks => prevTasks.map(t => {
                if (taskIds.includes(t.id) && t.dueDate) {
                    const newDate = new Date(t.dueDate);
                    const shift = direction === 'later' ? days : -days;
                    newDate.setDate(newDate.getDate() + shift);
                    return { ...t, dueDate: newDate.toISOString() };
                }
                return t;
            }));
        }

        try {
            const promises = taskIds.map(id => {
                // If we don't have tasks array passed in, we can't calculate new date safely for API unless we rely on backend logic?
                // But backend expects 'dueDate' string usually.
                // WE MUST HAVE 'tasks' prop to facilitate this safely.
                if (!tasks) return Promise.resolve(); // Fail safe

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
            // refetchTasks(); // Optional if optimistic is good
        } catch (err) {
            console.error("Failed to move dates:", err);
            showToast("Failed to update task dates", 'error');
            refetchTasks();
        }
    }, [tasks, setTasks, showToast, refetchTasks]);

    return {
        handleRevokeDelegation,
        handleUpdateTask,
        handleDeleteTasks,
        handleBulkUpdate,
        handleMoveDate
    };
};
