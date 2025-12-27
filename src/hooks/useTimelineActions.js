import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiClient } from '../api/client';

/**
 * Timeline Actions Hook - Action Orchestrator
 * 
 * PURPOSE:
 * Centralizes all timeline action handlers and modal state management.
 * Provides unified interface for context menus, bulk operations, and task modals.
 * 
 * WHY CENTRALIZE:
 * Timeline view has 10+ modals and 20+ actions. Managing state in component = chaos.
 * This hook isolates action logic, making UnifiedTimelineBoard cleaner.
 * 
 * STATE MANAGED (3 categories):
 * 
 * **1. Modal Visibility**:
 * - showNewTaskModal, showGoToDate, showCustomScale, showFlagModal, showMoveDateModal
 * - Each modal gets boolean state + setter
 * 
 * **2. Modal Context Data**:
 * - newTaskDefaults: Pre-fill new task with date + assignee from clicked cell
 * - flagDate: Date to flag (from header right-click)
 * - reassignTask, rescheduleTask, inviteTask: Task object for modal
 * - delegationUser: Colleague to delegate admin access to
 * 
 * **3. Context Menu**:
 * - contextMenu: { x, y, type, data } - Position, menu type, and context
 * - handleContextMenu: Right-click handler
 * 
 * DELEGATION WORKFLOW:
 * - Fetches admin delegations on mount (if user is admin/god)
 * - Creates delegationMap (Map of colleagueId -> delegation record)
 * - Used by context menu to show "Revoke" vs "Delegate" option
 * - handleRevokeDelegation: Confirms + deletes + refetches + shows toast
 * 
 * BULK OPERATIONS:
 * handleBulkUpdate uses Promise.allSettled (not Promise.all):
 * 
 * Why allSettled:
 * - Waits for ALL promises to complete (even if some fail)
 * - Reports: "Updated 8 tasks, 2 failed" vs "Update failed" (Promise.all)
 * - Better UX: Partial success > total failure
 * 
 * Flow:
 * 1. Map selectedTaskIds to PATCH /tasks/:id requests
 * 2. Await Promise.allSettled (fault-tolerant)
 * 3. Count succeeded vs failed results
 * 4. Show toast with success/failure counts
 * 5. Refetch tasks (refresh timeline)
 * 6. Clear selection (prevent accidental repeat)
 * 
 * CLEANUP PATTERN:
 * closeAllModals() centralizes modal cleanup:
 * - Closes all modals
 * - Resets all context data
 * - Called when user navigates away or explicitly closes
 * - Prevents modal state leaks
 * 
 * DEPENDENCIES:
 * Hook requires parent to provide:
 * - tasks: All tasks (for context)
 * - refetchTasks: Refresh data after mutations
 * - selectedTaskIds: Set of selected task IDs (multi-select)
 * - clearSelection: Reset selection after bulk ops
 * - user: Current user (for permission checks)
 * - showToast: Toast notification function
 * 
 * RETURN VALUE:
 * Returns object with 25+ properties (state + setters + handlers).
 * Parent destructures what it needs.
 * 
 * @param {Object} params - Hook dependencies
 * @param {Array<Object>} params.tasks - All tasks (for lookup)
 * @param {Function} params.refetchTasks - Refresh tasks after mutations
 * @param {Set<string>} params.selectedTaskIds - Set of selected task IDs
 * @param {Function} params.clearSelection - Clear multi-select
 * @param {Object} params.user - Current user (for permissions)
 * @param {Function} params.showToast - Toast notification callback
 * 
 * @returns {Object} Action handlers and state
 *   - Context menu: contextMenu, setContextMenu, handleContextMenu
 *   - Modals: show*, set* for each modal
 *   - Actions: handleBulkUpdate, handleUpdateTask, handleRevokeDelegation
 *   - Cleanup: closeAllModals
 *   - Data: delegations, delegationMap
 * 
 * @example
 * const {
 *   contextMenu, handleContextMenu,
 *   showNewTaskModal, setShowNewTaskModal,
 *   handleBulkUpdate,
 *   closeAllModals
 * } = useTimelineActions({
 *   tasks, refetchTasks,
 *   selectedTaskIds, clearSelection,
 *   user, showToast
 * });
 * 
 * // Right-click a task
 * <div onContextMenu={(e) => handleContextMenu(e, 'task', task)}>
 * 
 * // Bulk update priority
 * handleBulkUpdate({ priority: '1' }); // Sets all selected to P1
 */
export const useTimelineActions = ({ tasks, refetchTasks, selectedTaskIds, clearSelection, user, showToast }) => {
    const [contextMenu, setContextMenu] = useState(null);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [newTaskDefaults, setNewTaskDefaults] = useState({});
    const [showGoToDate, setShowGoToDate] = useState(false);
    const [showCustomScale, setShowCustomScale] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [showMoveDateModal, setShowMoveDateModal] = useState(false);
    const [flagDate, setFlagDate] = useState(null);

    // Action Modals State
    const [reassignTask, setReassignTask] = useState(null);
    const [rescheduleTask, setRescheduleTask] = useState(null);
    const [inviteTask, setInviteTask] = useState(null);

    // Delegation State
    const [delegations, setDelegations] = useState([]);
    const [delegationUser, setDelegationUser] = useState(null);

    // Fetch Delegations
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
                showToast('Admin access revoked', 'success');
            } catch (err) {
                console.error('Revoke failed:', err);
                showToast('Failed to revoke admin access', 'error');
            }
        }
    }, [showToast]);

    const delegationMap = useMemo(() => new Map(delegations.map(d => [d.delegate_id, d])), [delegations]);

    const handleContextMenu = useCallback((e, type, data) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, type, data });
    }, []);

    const handleBulkUpdate = useCallback(async (updates) => {
        try {
            const promises = Array.from(selectedTaskIds).map(taskId => apiClient.patch(`/tasks/${taskId}`, updates));
            const results = await Promise.allSettled(promises);

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed === 0) {
                showToast(`Updated ${succeeded} tasks`, 'success');
            } else {
                showToast(`Updated ${succeeded} tasks, ${failed} failed`, 'error');
            }

            refetchTasks();
            clearSelection();
        } catch (err) {
            console.error('Bulk update failed:', err);
            showToast('Bulk update failed', 'error');
        }
    }, [selectedTaskIds, refetchTasks, clearSelection, showToast]);

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

    const closeAllModals = useCallback(() => {
        setContextMenu(null);
        setShowNewTaskModal(false);
        setReassignTask(null);
        setRescheduleTask(null);
        setInviteTask(null);
        setShowMoveDateModal(false);
        setShowGoToDate(false);
        setShowCustomScale(false);
        setShowFlagModal(false);
        setDelegationUser(null);
    }, []);

    return {
        contextMenu, setContextMenu, handleContextMenu,
        showNewTaskModal, setShowNewTaskModal,
        newTaskDefaults, setNewTaskDefaults,
        showGoToDate, setShowGoToDate,
        showCustomScale, setShowCustomScale,
        showFlagModal, setShowFlagModal,
        showMoveDateModal, setShowMoveDateModal,
        flagDate, setFlagDate,
        reassignTask, setReassignTask,
        rescheduleTask, setRescheduleTask,
        inviteTask, setInviteTask,
        delegations, setDelegations,
        delegationUser, setDelegationUser,
        delegationMap,
        handleRevokeDelegation,
        handleBulkUpdate,
        handleUpdateTask,
        closeAllModals
    };
};
