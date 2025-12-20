import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Calendar, User, Plus } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApiData } from '../hooks/useApiData';

const NewTaskModal = ({ isOpen, onClose, onSuccess, initialDate, initialAssignee, initialData }) => {
    const { data: colleagues, refetch: refetchColleagues } = useApiData('/colleagues');

    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('whenever');
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [selectedAssignee, setSelectedAssignee] = useState(null);

    // Smart Assignee Logic
    const [showAddPrompt, setShowAddPrompt] = useState(false);
    const [isAddingUser, setIsAddingUser] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Handle discrete props (Legacy/LoneTasks)
        if (initialDate) setDueDate(new Date(initialDate).toISOString().split('T')[0]);
        if (initialAssignee) setSelectedAssignee(initialAssignee);

        // Handle object prop (Timeline Context Menu)
        if (initialData) {
            if (initialData.dueDate) setDueDate(new Date(initialData.dueDate).toISOString().split('T')[0]);
            if (initialData.assigneeId) setSelectedAssignee(initialData.assigneeId);
        }
    }, [initialDate, initialAssignee, initialData, isOpen]);

    // Filter colleagues
    const filteredColleagues = colleagues.filter(c =>
        c.name.toLowerCase().includes(assigneeSearch.toLowerCase())
    );

    useEffect(() => {
        // Show prompt if search has text but no matches, and we haven't selected someone yet
        if (assigneeSearch && filteredColleagues.length === 0 && !selectedAssignee) {
            setShowAddPrompt(true);
        } else {
            setShowAddPrompt(false);
        }
    }, [assigneeSearch, filteredColleagues.length, selectedAssignee]);

    const handleCreateUser = async () => {
        if (!assigneeSearch.includes('@')) {
            alert("Please enter an email address in the search field to create a new user (Format: Name or Email). Actually, let's just ask for email.");
            // For simplicity, let's assume the input is the name, and we prompt for email
            const email = prompt(`Enter email for ${assigneeSearch}:`);
            if (!email) return;

            setIsAddingUser(true);
            try {
                const res = await apiClient.post('/users', { email, name: assigneeSearch });
                await refetchColleagues();

                // Select the new user
                setSelectedAssignee(res.data.id); // Assuming Backend returns the new user object or similar
                setAssigneeSearch(res.data.display_name || assigneeSearch);
                setShowAddPrompt(false);
            } catch (err) {
                alert("Failed to create user: " + err.message);
            } finally {
                setIsAddingUser(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/tasks', {
                title,
                dueDate: new Date(dueDate).toISOString(),
                priority,
                assignedTo: selectedAssignee ? [selectedAssignee] : []
            });
            onSuccess?.();
            onClose();
            // Reset
            setTitle('');
            setAssigneeSearch('');
            setSelectedAssignee(null);
        } catch (err) {
            console.error(err);
            alert("Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>

                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl"><CheckSquare size={24} /></div>
                            <h3 className="text-2xl font-bold text-slate-900">New Task</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Task Title</label>
                                <input
                                    autoFocus
                                    className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 p-0"
                                    placeholder="What needs to be done?"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Date */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Due Date</label>
                                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                                        <Calendar size={18} className="text-slate-400" />
                                        <input
                                            type="date"
                                            className="bg-transparent border-none focus:ring-0 w-full text-sm font-bold text-slate-700"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Assignee */}
                                <div className="relative">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Assignee</label>

                                    {!selectedAssignee ? (
                                        <div className="relative">
                                            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl focus-within:ring-2 ring-teal-500/50">
                                                <User size={18} className="text-slate-400" />
                                                <input
                                                    className="bg-transparent border-none focus:ring-0 w-full text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                                    placeholder="Type name..."
                                                    value={assigneeSearch}
                                                    onChange={e => setAssigneeSearch(e.target.value)}
                                                />
                                            </div>

                                            {/* Dropdown */}
                                            {assigneeSearch && (
                                                <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-xl z-50 max-h-48 overflow-y-auto">
                                                    {filteredColleagues.map(c => (
                                                        <div
                                                            key={c.id}
                                                            onClick={() => { setSelectedAssignee(c.id); setAssigneeSearch(''); }}
                                                            className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                                                        >
                                                            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs">{c.avatar}</div>
                                                            <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                                        </div>
                                                    ))}

                                                    {showAddPrompt && (
                                                        <div
                                                            onClick={handleCreateUser}
                                                            className="p-3 bg-teal-50 hover:bg-teal-100 cursor-pointer flex items-center gap-2 text-teal-700 transition-colors"
                                                        >
                                                            <div className="w-6 h-6 bg-teal-200 rounded-full flex items-center justify-center"><Plus size={14} /></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold">Add "{assigneeSearch}" to Directory</span>
                                                                <span className="text-[10px] opacity-70">create new entry & assign</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-teal-50 p-3 rounded-xl border border-teal-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-teal-200 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {colleagues.find(c => c.id === selectedAssignee)?.avatar}
                                                </div>
                                                <span className="text-sm font-bold text-teal-900">
                                                    {colleagues.find(c => c.id === selectedAssignee)?.name}
                                                </span>
                                            </div>
                                            <button onClick={() => setSelectedAssignee(null)} className="p-1 hover:bg-teal-200 rounded-lg text-teal-700"><X size={14} /></button>
                                        </div>
                                    )}
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value)}
                                        className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold text-slate-700 border-none focus:ring-2 focus:ring-teal-500/50 appearance-none cursor-pointer"
                                    >
                                        <option value="asap">A.S.A.P.</option>
                                        <option value="sooner">Sooner is better</option>
                                        <option value="whenever">Whenever</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    {loading ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div >
        </AnimatePresence >
    );
};

export default NewTaskModal;
