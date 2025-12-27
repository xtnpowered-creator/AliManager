import React from 'react';
import { Eye, EyeOff, CalendarDays, Clock, User, UserPlus, Zap, Play, Pause, CheckCircle2, Square, Trash2, Ban, Maximize2, RotateCcw, Flag, Plus, Shield, Calendar } from 'lucide-react';

/**
 * Context Menu Options Factory
 * 
 * PURPOSE:
 * Generates context menu options dynamically based on what user right-clicked.
 * Supports four menu types: Task, Header, Colleague, Empty Slot.
 * 
 * ARCHITECTURE - CONTEXT MENU TYPES:
 * 
 * 1. **TASK MENU** (right-click on task card):
 *    - View Details: Navigate to task detail page
 *    - Change Due Date: Open RescheduleModal
 *    - Move Due Date X days: Open MoveDateModal (bulk shift)
 *    - Reassign: Open ReassignModal
 *    - Add Collab Assignment: Open InviteModal
 *    - Set Priority: Submenu with 1-4 + None (owner/admin only)
 *    - Mark Doing/Paused/Done/Pending: Bulk status update
 *    - Delete Task: Opens DeleteTaskModal
 * 
 * 2. **HEADER MENU** (right-click on timeline header):
 *    - Go to date: Open GoToDateModal (jump to specific date)
 *    - Set Custom Scale: Open CustomScaleModal (adjust zoom)
 *    - Return to default scale: Reset to scale=10 (if changed)
 *    - Set Custom Flag: Opens FlagModal to mark important date
 * 
 * 3. **COLLEAGUE MENU** (right-click on colleague name):
 *    - Delegate Admin Access: Opens DelegationModal (admin only)
 *    - Revoke Admin Access: Removes delegation (admin only, if delegated)
 *    - View Profile: Opens profile view (pending implementation)
 *    - Self-user: Returns empty menu (can't delegate to yourself)
 * 
 * 4. **EMPTY SLOT MENU** (right-click on empty timeline cell):
 *    - Create Task Here: Opens NewTaskModal with pre-filled date + assignee
 *    - Show/Hide DONE Tasks: Toggles visibility filter
 * 
 * PERMISSION MODEL:
 * - **Priority Menu**: Only visible to task owner OR admin/god role
 * - **Delegation Menu**: Only visible to admin/god role
 * - **User Protection**: Cannot delegate to yourself
 * - **Bulk Operations**: Clear selection after bulk update to prevent accidental repeat
 * 
 * BULK OPERATIONS:
 * Menu supports multi-select operations via `selectedTaskIds` Set:
 * - Set Priority: Apply to all selected tasks
 * - Mark Status: Apply to all selected tasks
 * - After bulk update: Clear selection (setSelectedTaskIds(new Set()))
 * 
 * CALLBACK ARCHITECTURE:
 * Parent component provides all action handlers via `callbacks` object.
 * This keeps menu logic pure and testable - no direct API calls or state mutations.
 * 
 * Common callbacks:
 * - navigate: React Router navigation
 * - setXxxModal: Modal visibility toggles
 * - onBulkUpdate: Batch task updates
 * - handleScaleChange: Timeline zoom control
 * - handleRevokeDelegation: Admin access removal
 * - onDelegateConfig: Admin delegation workflow
 * 
 * MENU RENDERING:
 * Menu items structure:
 * - label: Display text
 * - icon: Lucide icon component or custom render function
 * - onClick: Action callback (wrapped in withClose to auto-dismiss menu)
 * - danger: Red styling for destructive actions
 * - submenu: Nested menu items (e.g., priority levels)
 * - type: 'separator' for visual dividers
 * 
 * AUTO-CLOSE PATTERN:
 * `withClose(action)` wrapper ensures menu closes after any action.
 * Prevents menu staying open after user makes selection.
 * 
 * @param {Object} params - Menu configuration
 * @param {string} params.type - Menu type: 'task'|'header'|'colleague'|'empty-slot'
 * @param {Object} params.data - Context data (task, colleague, or date info)
 * @param {Object} params.user - Current user object (for permission checks)
 * @param {Map} params.delegationMap - Map of colleague IDs to delegation records
 * @param {Object} params.callbacks - All action handlers and modal setters
 * 
 * @returns {Array<MenuItem>} Array of menu item objects
 * 
 * MenuItem shape:
 * {
 *   label: string,
 *   icon: LucideIcon | Function,
 *   onClick: Function,
 *   danger?: boolean,
 *   submenu?: Array<MenuItem>,
 *   type?: 'separator'
 * }
 * 
 * @example
 * // Task context menu
 * const taskMenuOptions = getMenuOptions({
 *   type: 'task',
 *   data: { id: 'task-123', title: 'Fix bug', isOwner: true },
 *   user: { id: 'user-1', role: 'admin' },
 *   delegationMap: new Map(),
 *   callbacks: {
 *     navigate: (path) => router.push(path),
 *     setRescheduleTask: (task) => setModalTask(task),
 *     onBulkUpdate: (ids, updates) => api.patch('/tasks/bulk', { ids, updates }),
 *     // ...other callbacks
 *   }
 * });
 */
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
