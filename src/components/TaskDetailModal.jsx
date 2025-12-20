import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Clock, CheckCircle2, AlertCircle, Type, Text, MoreHorizontal } from 'lucide-react';
import { apiClient } from '../api/client';

const TaskDetailModal = ({ isOpen, onClose, task, onUpdate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('todo');
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(false);

    // Sync task data when opened
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status || 'todo');
            setPriority(task.priority || 'medium');
        }
    }, [task, isOpen]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Optimistic update
            const updates = { title, description, status, priority };
            onUpdate(task.id, null, updates); // null date means date unchanged

            // API Call
            await apiClient.patch(`/tasks/${task.id}`, updates);
            onClose();
        } catch (error) {
            console.error('Failed to update task:', error);
            alert('Failed to save changes.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !task) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden ring-1 ring-slate-900/5"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                        <div className="flex-1 w-full">
                            <input
                                className="w-full bg-transparent text-2xl font-black text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 p-0"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task Title"
                            />
                        </div>
                        <button onClick={onClose} className="ml-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-8 space-y-8">

                            {/* Properties Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 py-3"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="doing">In Progress</option>
                                        <option value="done">Completed</option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <AlertCircle size={12} /> Priority
                                    </label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'asap', label: 'A.S.A.P.' },
                                            { id: 'sooner', label: 'Sooner' },
                                            { id: 'whenever', label: 'Whenever' }
                                        ].map(opt => {
                                            const isActive = priority === opt.id || (opt.id === 'asap' && priority === 'high') || (opt.id === 'sooner' && priority === 'medium') || (opt.id === 'whenever' && priority === 'low');

                                            let activeClass = '';
                                            if (isActive) {
                                                if (opt.id === 'asap') activeClass = 'border-slate-900 bg-slate-900 text-white shadow-md';
                                                else if (opt.id === 'sooner') activeClass = 'border-amber-500 bg-amber-50 text-amber-700';
                                                else activeClass = 'border-slate-300 bg-slate-100 text-slate-600';
                                            } else {
                                                activeClass = 'border-slate-100 bg-transparent text-slate-400 hover:border-slate-200';
                                            }

                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setPriority(opt.id)}
                                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${activeClass}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Text size={12} /> Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add more details about this task..."
                                    className="w-full min-h-[150px] bg-slate-50 border-none rounded-2xl p-4 text-slate-700 text-sm leading-relaxed focus:ring-2 focus:ring-teal-500 resize-none"
                                />
                            </div>

                            {/* Metadata / Collaborators (To Be Expanded) */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                    Collaboration Features (Comments & Files) Coming Soon
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TaskDetailModal;
