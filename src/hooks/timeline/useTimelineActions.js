import { useCallback } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../context/ToastContext';

/**
 * useTimelineActions Hook
 * 
 * Provides task mutation methods with optimistic updates and error recovery.
 * Implements the action layer for timeline views.
 * 
 * Optimistic Update Pattern:
 * 1. Immediately update local state (setTasks) for instant UI feedback
 * 2. Send API request in background
 * 3. On success: Refetch to sync with server (gets computed columns, etc.)
 * 4. On error: Refetch to revert to server state + show error toast
 * 
 * Why This Pattern?
 * - Instant UI feedback (no loading spinners for every action)
 * - Graceful degradation (auto-reverts on failure)
 * - Server remains source of truth (final refetch ensures consistency)
 * 
 * Actions Provided:
 * - handleUpdateTask: Single task update (e.g., status, priority)
 * - handleDeleteTasks: Bulk delete with Set of task IDs
 * - handleBulkUpdate: Apply same update to multiple tasks
 * - handleMoveDate: Shift due dates by N days (earlier/later)
 * - handleRevokeDelegation: Admin-only, revoke delegation
 * 
 * @param {Object} params
 * @param {Array<Object>} params.tasks - Current tasks array (for lookups in move date)
 * @param {Function} params.setTasks - State setter for optimistic updates
 * @param {Function} params.refetchTasks - Triggers full data refetch
 * @param {Function} [params.setDelegations] - State setter for delegations (optional, admin only)
 * @returns {Object} Action methods
 */
export const useTimelineActions = ({ tasks, setTasks, refetchTasks, setDelegations }) => {
    const { showToast } = useToast();

    /**
     * Revoke Admin Delegation
     * Admin-only action to remove admin access from a colleague
     */
    const handleRevokeDelegation = useCallback(async (delegationId) => {
        if (!setDelegations) return; // Guard if not provided (non-admin users)

        if (confirm('Are you sure you want to revoke admin access?')) {
            try {
                await apiClient.delete(`/delegations/${delegationId}`);
                // Refetch delegations list to update UI
                const res = await apiClient.get('/delegations');
                setDelegations(res);
                showToast('Delegation revoked', 'success');
            } catch (err) {
                console.error('Revoke failed:', err);
                showToast('Failed to revoke.', 'error');
            }
        }
    }, [setDelegations, showToast]);

    /**
     * Update Single Task
     * Optimistically updates local state, then syncs with server
     * 
     * @param {string} taskId - Task ID to update
     * @param {Object} updates - Partial task object with fields to update
     */
    const handleUpdateTask = useCallback(async (taskId, updates) => {
        try {
            // Optimistic Update: Instant UI feedback
            if (setTasks) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            }

            // Background API call
            await apiClient.patch(`/tasks/${taskId}`, updates);

            // Refetch to sync with server (gets computed columns, validation, etc.)
            refetchTasks();
            showToast('Task updated', 'success');
        } catch (err) {
            console.error('Failed to update task:', err);
            showToast('Failed to update task', 'error');
            refetchTasks(); // Revert to server state
        }
    }, [refetchTasks, showToast, setTasks]);

    /**
     * Delete Tasks (Bulk)
     * Accepts Set of task IDs, deletes all via parallel API calls
     * 
     * @param {Set<string>} taskIds - Set of task IDs to delete
     * @returns {boolean} Success status
     */
    const handleDeleteTasks = useCallback(async (taskIds) => {
        if (!taskIds || taskIds.size === 0) return false;

        const idsToDelete = Array.from(taskIds);

        // Optimistic removal from UI
        if (setTasks) {
            setTasks(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        }

        try {
            // Parallel delete requests
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

    /**
     * Bulk Update
     * Applies same update object to multiple tasks
     * Handles special logic for status changes (sets/clears completedAt)
     * 
     * @param {Set<string>} selectedTaskIds - Set of task IDs to update
     * @param {Object} updates - Update object to apply to all tasks
     */
    const handleBulkUpdate = useCallback(async (selectedTaskIds, updates) => {
        const ids = Array.from(selectedTaskIds);

        // Optimistic update with status-aware logic
        if (setTasks) {
            setTasks(prev => prev.map(t => {
                if (ids.includes(t.id)) {
                    const newT = { ...t, ...updates };
                    // Auto-populate completedAt when marking as done
                    if (updates.status === 'done') newT.completedAt = new Date().toISOString();
                    // Clear completedAt when changing away from done
                    else if (updates.status) newT.completedAt = null;
                    return newT;
                }
                return t;
            }));
        }

        try {
            // Parallel update requests
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

    /**
     * Move Due Dates
     * Shifts due dates by N days in specified direction
     * Requires tasks array to calculate new dates
     * 
     * @param {Array<string>} taskIds - Array of task IDs to move
     * @param {number} days - Number of days to shift
     * @param {string} direction - 'later' or 'earlier'
     */
    const handleMoveDate = useCallback(async (taskIds, days, direction) => {
        if (!taskIds || taskIds.length === 0 || !days) return;

        // Optimistic date shift
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
                // Fail-safe: Need tasks array to calculate new dates
                if (!tasks) return Promise.resolve();

                const task = tasks.find(t => t.id === id);
                if (!task || !task.dueDate) return Promise.resolve();

                // Calculate shifted date
                const currentDate = new Date(task.dueDate);
                const shift = direction === 'later' ? days : -days;
                currentDate.setDate(currentDate.getDate() + shift);

                return apiClient.patch(`/tasks/${id}`, {
                    dueDate: currentDate.toISOString()
                });
            });

            await Promise.all(promises);
            showToast(`Moved due dates (${taskIds.length} Tasks)`, 'success');
            // Optional refetch - optimistic update is usually sufficient
        } catch (err) {
            console.error("Failed to move dates:", err);
            showToast("Failed to update task dates", 'error');
            refetchTasks(); // Revert
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
