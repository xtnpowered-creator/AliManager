import React, { useState } from 'react';
import { useApiData } from '../hooks/useApiData';
import { apiClient } from '../api/client';
import { Plus, Trash2, Calendar, User, Check, X } from 'lucide-react';

const TaskStepsList = ({ taskId, taskAssigneeId, taskDueDate }) => {
    // Fetch Steps
    const { data: steps = [], refetch } = useApiData(`/steps?taskId=${taskId}`);
    const { data: colleagues } = useApiData('/colleagues');

    // Local state for "Adding New Step" Input
    const [newItemTitle, setNewItemTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddStep = async (e) => {
        e.preventDefault();
        if (!newItemTitle.trim()) {
            setIsAdding(false);
            return;
        }

        try {
            await apiClient.post('/steps', {
                taskId,
                title: newItemTitle,
                assignedTo: taskAssigneeId, // Inherit by default
                dueDate: taskDueDate // Inherit by default
            });
            setNewItemTitle('');
            setIsAdding(false);
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleStep = async (step) => {
        // Optimistic update could go here, but for now allow SWR to refetch
        try {
            await apiClient.patch(`/steps/${step.id}`, { isCompleted: !step.isCompleted });
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this step?')) return;
        try {
            await apiClient.delete(`/steps/${id}`);
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateTitle = async (id, newTitle) => {
        try {
            await apiClient.patch(`/steps/${id}`, { title: newTitle });
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-3xl border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Plan of Attack</h3>
                    <p className="text-xs text-slate-500 mt-1">{steps.length} Steps • {steps.filter(s => s.isCompleted).length} Completed</p>
                </div>
                {/* Progress Bar */}
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${steps.length ? (steps.filter(s => s.isCompleted).length / steps.length) * 100 : 0}%` }}
                    />
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {steps.map(step => (
                    <StepRow
                        key={step.id}
                        step={step}
                        colleagues={colleagues}
                        onToggle={() => handleToggleStep(step)}
                        onDelete={() => handleDelete(step.id)}
                        onUpdateTitle={(title) => handleUpdateTitle(step.id, title)}
                    />
                ))}

                {/* Add New Row */}
                <div className="px-6 py-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    {isAdding ? (
                        <form onSubmit={handleAddStep} className="flex items-center gap-3">
                            <input
                                autoFocus
                                className="flex-1 bg-white border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm"
                                placeholder="What's the next step?"
                                value={newItemTitle}
                                onChange={e => setNewItemTitle(e.target.value)}
                                onBlur={() => !newItemTitle && setIsAdding(false)}
                            />
                            <button type="submit" className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"><Check size={16} /></button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 text-slate-500 hover:text-teal-600 font-medium text-sm transition-colors w-full"
                        >
                            <Plus size={18} />
                            <span>Add a step...</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const StepRow = ({ step, colleagues, onToggle, onDelete, onUpdateTitle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(step.title);

    const submitEdit = () => {
        if (tempTitle !== step.title) onUpdateTitle(tempTitle);
        setIsEditing(false);
    };

    const assignee = colleagues?.find(c => c.id === step.assignedTo);

    return (
        <div className={`px-6 py-3 flex items-center gap-4 group transition-colors ${step.isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
            {/* Checkbox */}
            <button
                onClick={onToggle}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${step.isCompleted
                        ? 'bg-teal-500 border-teal-500 text-white'
                        : 'bg-white border-slate-300 text-transparent hover:border-teal-400'
                    }`}
            >
                <Check size={12} strokeWidth={3} />
            </button>

            {/* Title */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input
                        autoFocus
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-teal-500"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={submitEdit}
                        onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                    />
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className={`text-sm cursor-text truncate ${step.isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700 font-medium'}`}
                    >
                        {step.title}
                    </div>
                )}
            </div>

            {/* Meta Actions (Assignee, Date) */}
            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                {/* Assignee Badge */}
                <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200 text-xs text-slate-500 font-medium transition-colors" title="Change Assignee">
                    {assignee ? (
                        <>
                            <div className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[8px] font-bold">{assignee.avatar}</div>
                            <span className="max-w-[80px] truncate hidden md:block">{assignee.name.split(' ')[0]}</span>
                        </>
                    ) : (
                        <User size={14} />
                    )}
                </button>

                {/* Date Badge */}
                <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200 text-xs text-slate-500 font-medium transition-colors" title="Change Date">
                    <Calendar size={14} />
                    {step.dueDate ? (
                        <span className="hidden md:block">{new Date(step.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    ) : null}
                </button>

                {/* Delete */}
                <button onClick={onDelete} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors" title="Delete Step">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

export default TaskStepsList;
