import React from 'react';
import { Eye, EyeOff, CalendarDays, Clock, User, UserPlus, Zap, Play, Pause, CheckCircle2, Square, Trash2, Ban, Maximize2, RotateCcw, Flag, Plus, Shield, Calendar } from 'lucide-react';

export const getMenuOptions = ({
    type,
    data,
    user,
    delegationMap,
    callbacks
}) => {
    const {
        navigate,
        setRescheduleTask,
        setReassignTask,
        setInviteTask,
        onBulkUpdate,
        setShowDeleteModal,
        setShowGoToDate,
        setShowCustomScale,
        handleScaleChange,
        setFlagDate,
        setShowFlagModal,
        handleRevokeDelegation,
        onDelegateConfig,
        setNewTaskDefaults,
        setShowNewTaskModal,
        setShowMoveDateModal,
        selectedTaskIds,
        setSelectedTaskIds,
        scale
    } = callbacks;

    // Helper to close menu after action
    const withClose = (action) => () => {
        action();
        if (callbacks.closeMenu) callbacks.closeMenu();
    };

    if (type === 'task') {
        const isOwner = data.isOwner || user?.role === 'god';
        return [
            { label: 'View Details', icon: Eye, onClick: withClose(() => navigate(`/task/${data.id}`)) },
            { type: 'separator' },
            { label: 'Change Due Date...', icon: CalendarDays, onClick: withClose(() => setRescheduleTask(data)) },
            { label: 'Move Due Date X days...', icon: Clock, onClick: withClose(() => setShowMoveDateModal(true)) },
            { label: 'Reassign...', icon: User, onClick: withClose(() => setReassignTask(data)) },
            { label: 'Add Collab Assignment...', icon: UserPlus, onClick: withClose(() => setInviteTask(data)) },
            { type: 'separator' },
            ...(isOwner ? [{
                label: 'Set Priority', icon: Zap,
                submenu: [
                    { label: '1 - NOW!', icon: () => <div className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">1</div>, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { priority: '1' }); setSelectedTaskIds(new Set()); }) },
                    { label: '2 - ASAP', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">2</div>, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { priority: '2' }); setSelectedTaskIds(new Set()); }) },
                    { label: '3 - Soon', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">3</div>, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { priority: '3' }); setSelectedTaskIds(new Set()); }) },
                    { label: '4 - Later', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">4</div>, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { priority: '4' }); setSelectedTaskIds(new Set()); }) },
                    { label: 'None', icon: Ban, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { priority: null }); setSelectedTaskIds(new Set()); }) }
                ]
            }] : []),
            { type: 'separator' },
            { label: 'Mark Doing', icon: Play, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { status: 'doing' }); setSelectedTaskIds(new Set()); }) },
            { label: 'Mark Paused', icon: Pause, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { status: 'paused' }); setSelectedTaskIds(new Set()); }) },
            { label: 'Mark Done', icon: CheckCircle2, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { status: 'done' }); setSelectedTaskIds(new Set()); }) },
            { label: 'Mark Pending', icon: Square, onClick: withClose(() => { onBulkUpdate(selectedTaskIds, { status: 'todo' }); setSelectedTaskIds(new Set()); }) },
            { label: 'Delete Task', icon: Trash2, danger: true, onClick: withClose(() => setShowDeleteModal(true)) }
        ];
    }

    if (type === 'header') {
        return [
            { label: 'Go to date...', icon: Calendar, onClick: withClose(() => setShowGoToDate(true)) },
            { label: 'Set Custom Scale...', icon: Maximize2, onClick: withClose(() => setShowCustomScale(true)) },
            ...(scale !== 10 ? [{ label: 'Return to default scale', icon: RotateCcw, onClick: withClose(() => handleScaleChange(10)) }] : []),
            { label: 'Set Custom Flag...', icon: Flag, onClick: withClose(() => { setFlagDate(data.date); setShowFlagModal(true); }) }
        ];
    }

    if (type === 'colleague') {
        const isSelf = data.id === (user?.id || user?.uid);
        if (isSelf) return [];

        const isAdmin = user?.role === 'admin' || user?.role === 'god';
        return [
            ...(isAdmin ? [
                ...(delegationMap.has(data.id) ?
                    [{ label: 'Revoke Admin Access', icon: Ban, danger: true, onClick: withClose(() => handleRevokeDelegation(delegationMap.get(data.id).id)) }] :
                    [{ label: 'Delegate Admin Access...', icon: Shield, onClick: withClose(() => onDelegateConfig(data)) }]
                ),
                { type: 'separator' }
            ] : []),
            { label: 'View Profile', icon: Eye, onClick: withClose(() => console.warn("Pending")) }
        ];
    }

    // Default: Empty Slot (Create Task)
    return [
        { label: 'Create Task Here...', icon: Plus, onClick: withClose(() => { setNewTaskDefaults({ dueDate: data.date, assigneeId: data.colleagueId }); setShowNewTaskModal(true); }) },
        { type: 'separator' },
        { label: callbacks.showDoneTasks ? 'Hide DONE Tasks' : 'Show DONE Tasks', icon: callbacks.showDoneTasks ? EyeOff : Eye, onClick: withClose(callbacks.toggleShowDoneTasks) }
    ];
};
