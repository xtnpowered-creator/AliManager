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

const TimelineModals = ({
    tasks,
    selectedTaskIds,
    setSelectedTaskIds,
    refetchTasks,
    scrollToDate,
    handleScaleChange,

    // State & Setters
    reassignTask, setReassignTask,
    rescheduleTask, setRescheduleTask,
    inviteTask, setInviteTask,
    showMoveDateModal, setShowMoveDateModal,
    showNewTaskModal, setShowNewTaskModal,
    newTaskDefaults,
    showGoToDate, setShowGoToDate,
    showCustomScale, setShowCustomScale,
    showFlagModal, setShowFlagModal,
    flagDate,
    delegationUser, setDelegationUser,
    setDelegations,
    // Delete Props
    showDeleteModal, setShowDeleteModal, handleDeleteTasks,
    handleMoveDate,
    handleBulkUpdate
}) => {
    return (
        <>
            <ReassignModal
                isOpen={!!reassignTask}
                onClose={() => setReassignTask(null)}
                onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }}
                taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : reassignTask?.id}
                taskTitle={reassignTask?.title}
                currentAssigneeId={reassignTask?.assignedTo?.[0]}
                onConfirm={handleBulkUpdate} // OPTIMISTIC
            />

            <RescheduleModal
                isOpen={!!rescheduleTask}
                onClose={() => setRescheduleTask(null)}
                onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }}
                taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : rescheduleTask?.id}
                taskTitle={rescheduleTask?.title}
                currentDate={rescheduleTask?.dueDate}
                onConfirm={handleBulkUpdate} // OPTIMISTIC
            />

            <InviteModal
                isOpen={!!inviteTask}
                onClose={() => { setInviteTask(null); setSelectedTaskIds(new Set()); }}
                taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : inviteTask?.id}
                taskTitle={inviteTask?.title}
            />

            <MoveDateModal
                isOpen={showMoveDateModal}
                onClose={() => setShowMoveDateModal(false)}
                onSuccess={() => { setSelectedTaskIds(new Set()); }} // refetch handled internally by handleMoveDate
                tasks={tasks}
                selectedTaskIds={selectedTaskIds}
                onConfirm={handleMoveDate} // PASS HANDLER
            />

            <NewTaskModal
                isOpen={showNewTaskModal}
                onClose={() => setShowNewTaskModal(false)}
                onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }}
                initialData={newTaskDefaults}
            />

            <GoToDateModal
                isOpen={showGoToDate}
                onClose={() => setShowGoToDate(false)}
                onGo={(date) => scrollToDate(date)}
            />

            <CustomScaleModal
                isOpen={showCustomScale}
                onClose={() => setShowCustomScale(false)}
                onApply={handleScaleChange}
            />

            <FlagModal
                isOpen={showFlagModal}
                onClose={() => setShowFlagModal(false)}
                initialDate={flagDate}
            />

            <DelegationModal
                isOpen={!!delegationUser}
                colleague={delegationUser}
                onClose={() => setDelegationUser(null)}
                onSuccess={() => apiClient.get('/delegations').then(setDelegations)}
            />

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
