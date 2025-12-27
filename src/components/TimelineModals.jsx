import React from 'react';
import ReassignModal from './ReassignModal';
import RescheduleModal from './RescheduleModal';
import InviteModal from './InviteModal';
import NewTaskModal from './NewTaskModal';
import MoveDateModal from './MoveDateModal';
import DeleteTaskModal from './DeleteTaskModal';
import { GoToDateModal, CustomScaleModal, FlagModal } from './HeaderModals';
import DelegationModal from './DelegationModal';
import { apiClient } from '../api/client';

/**
 * TimelineModals Component
 * 
 * Centralized modal management for UnifiedTimelineBoard.
 * Aggregates all timeline-related modals in one component for cleaner main timeline code.
 * 
 * Pattern: Controlled Modals
 * - Each modal has isOpen state managed by parent
 * - Parent passes down state + setters as props
 * - Modals call onClose/onSuccess callbacks to update parent state
 * 
 * Modal Categories:
 * 
 * 1. **Task Mutation Modals**:
 *    - ReassignModal: Change task assignee
 *    - RescheduleModal: Change due date
 *    - InviteModal: Add collaborator to task
 *    - MoveDateModal: Shift due dates by N days
 *    - DeleteTaskModal: Confirm bulk delete
 * 
 * 2. **Task Creation**:
 *    - NewTaskModal: Create new task (with optional defaults)
 * 
 * 3. **Navigation Modals**:
 *    - GoToDateModal: Jump to specific date
 *    - CustomScaleModal: Set custom zoom level
 *    - FlagModal: Add custom date markers
 * 
 * 4. **Admin Modals**:
 *    - DelegationModal: Grant/revoke admin access
 * 
 * Bulk Operations:
 * - Most modals support bulk actions via selectedTaskIds Set
 * - If selectedTaskIds.size > 1: Apply to all selected tasks
 * - If single task: Use specific task's ID from modal trigger
 * 
 * Optimistic Updates:
 * - onConfirm handlers (handleBulkUpdate, handleMoveDate) perform optimistic updates
 * - refetchTasks() called after async operations complete
 * - setSelectedTaskIds(new Set()) clears selection after successful mutations
 * 
 * @param {Object} props - Modal state and handlers from parent
 */
const TimelineModals = ({
    tasks,
    selectedTaskIds,
    setSelectedTaskIds,
    refetchTasks,
    scrollToDate,
    scale,
    handleScaleChange,

    // Task Mutation Modal States
    reassignTask, setReassignTask,
    rescheduleTask, setRescheduleTask,
    inviteTask, setInviteTask,
    showMoveDateModal, setShowMoveDateModal,
    showNewTaskModal, setShowNewTaskModal,
    newTaskDefaults,

    // Navigation Modal States
    showGoToDate, setShowGoToDate,
    showCustomScale, setShowCustomScale,
    showFlagModal, setShowFlagModal,
    flagDate,

    // Admin Modal States
    delegationUser, setDelegationUser,
    setDelegations,

    // Delete Props
    showDeleteModal, setShowDeleteModal, handleDeleteTasks,
    handleMoveDate,
    handleBulkUpdate,
    colleagues
}) => {
    return (
        <>
            {/* Task Reassignment Modal */}
            <ReassignModal
                isOpen={!!reassignTask}
                onClose={() => setReassignTask(null)}
                onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }}
                taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : reassignTask?.id}
                taskTitle={reassignTask?.title}
                currentAssigneeId={reassignTask?.assignedTo?.[0]}
                onConfirm={handleBulkUpdate} // Optimistic update handler
            />

            {/* Reschedule Due Date Modal */}
            <RescheduleModal
                isOpen={!!rescheduleTask}
                onClose={() => setRescheduleTask(null)}
                onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }}
                taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : rescheduleTask?.id}
                taskTitle={rescheduleTask?.title}
                currentDate={rescheduleTask?.dueDate}
                onConfirm={handleBulkUpdate} // Optimistic update handler
            />

            {/* Invite Collaborator Modal */}
            <InviteModal
                isOpen={!!inviteTask}
                onClose={() => { setInviteTask(null); setSelectedTaskIds(new Set()); }}
                taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : inviteTask?.id}
                taskTitle={inviteTask?.title}
            />

            {/* Move Date by N Days Modal */}
            <MoveDateModal
                isOpen={showMoveDateModal}
                onClose={() => setShowMoveDateModal(false)}
                onSuccess={() => { setSelectedTaskIds(new Set()); }}
                tasks={tasks}
                selectedTaskIds={selectedTaskIds}
                onConfirm={handleMoveDate} // Optimistic handler
            />

            {/* New Task Creation Modal */}
            <NewTaskModal
                isOpen={showNewTaskModal}
                onClose={() => setShowNewTaskModal(false)}
                onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }}
                initialData={newTaskDefaults} // Pre-fill from context menu (date, assignee)
            />

            {/* Navigate to Date Modal */}
            <GoToDateModal
                isOpen={showGoToDate}
                onClose={() => setShowGoToDate(false)}
                onGo={(date) => scrollToDate(date)}
            />

            {/* Custom Scale (Zoom) Modal */}
            <CustomScaleModal
                isOpen={showCustomScale}
                onClose={() => setShowCustomScale(false)}
                onApply={handleScaleChange}
                currentScale={scale}
            />

            {/* Flag Date Marker Modal */}
            <FlagModal
                isOpen={showFlagModal}
                onClose={() => setShowFlagModal(false)}
                initialDate={flagDate}
            />

            {/* Admin Delegation Modal */}
            <DelegationModal
                isOpen={!!delegationUser}
                colleague={delegationUser}
                onClose={() => setDelegationUser(null)}
                onSuccess={() => apiClient.get('/delegations').then(setDelegations)}
            />

            {/* Delete Task Confirmation Modal */}
            <DeleteTaskModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={async () => {
                    const success = await handleDeleteTasks(selectedTaskIds);
                    if (success) {
                        setSelectedTaskIds(new Set());
                    }
                }}
                taskCount={selectedTaskIds.size}
            />
        </>
    );
};

export default TimelineModals;
