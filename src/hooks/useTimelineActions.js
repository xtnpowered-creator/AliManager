import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiClient } from '../api/client';

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
