import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Plus, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApiData } from '../hooks/useApiData';

const ReassignModal = ({ isOpen, onClose, onSuccess, taskId, taskTitle, currentAssigneeId }) => {
    const { data: colleagues, refetch: refetchColleagues } = useApiData('/colleagues');

    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [showAddPrompt, setShowAddPrompt] = useState(false);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [loading, setLoading] = useState(false);

    const taskIds = Array.isArray(taskId) ? taskId : [taskId].filter(Boolean);
    const isBulk = taskIds.length > 1;

    // Initial State
    useEffect(() => {
        if (isOpen) {
            setSelectedAssignee(null);
            setAssigneeSearch('');
        }
    }, [isOpen]);

    // Filter colleagues
    const filteredColleagues = colleagues.filter(c =>
        c.name.toLowerCase().includes(assigneeSearch.toLowerCase())
    );

    useEffect(() => {
        if (assigneeSearch && filteredColleagues.length === 0 && !selectedAssignee) {
            setShowAddPrompt(true);
        } else {
            setShowAddPrompt(false);
        }
    }, [assigneeSearch, filteredColleagues.length, selectedAssignee]);

    const handleCreateUser = async () => {
        if (!assigneeSearch.includes('@')) {
            const email = prompt(`Enter email for ${assigneeSearch}:`);
            if (!email) return;

            setIsAddingUser(true);
            try {
                const res = await apiClient.post('/users', { email, name: assigneeSearch });
                await refetchColleagues();
                setSelectedAssignee(res.data.id);
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
        if (!selectedAssignee || taskIds.length === 0) return;

        setLoading(true);
        try {
            const promises = taskIds.map(id =>
                apiClient.patch(`/tasks/${id}`, {
                    assignedTo: [selectedAssignee]
                })
            );
            await Promise.all(promises);
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to reassign task(s)");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const currentAssignee = colleagues.find(c => c.id === currentAssigneeId);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>

                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl"><User size={24} /></div>
                            <h3 className="text-2xl font-bold text-slate-900">{isBulk ? `Reassign ${taskIds.length} Tasks` : 'Reassign Task'}</h3>
                        </div>
                        <p className="text-slate-500 font-medium mb-6 line-clamp-1">{isBulk ? `${taskIds.length} items will be moved` : taskTitle}</p>

                        {!isBulk ? (
                            <div className="flex items-center gap-4 mb-6 text-sm">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                        {currentAssignee?.avatar || '?'}
                                    </div>
                                    <span className="font-bold strike-through decoration-2 decoration-slate-300 line-through decoration-slate-400/50">{currentAssignee?.name || 'Unassigned'}</span>
                                </div>
                                <ArrowRight size={16} className="text-slate-300" />
                                <div className="font-bold text-teal-600">
                                    {selectedAssignee ? (colleagues.find(c => c.id === selectedAssignee)?.name) : 'Select New Owner'}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 mb-6 text-sm">
                                <div className="font-bold text-teal-600">
                                    Set to: {selectedAssignee ? (colleagues.find(c => c.id === selectedAssignee)?.name) : 'Select New Owner'}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Assignee Search */}
                            <div className="relative">
                                {!selectedAssignee ? (
                                    <div className="relative">
                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl focus-within:ring-2 ring-teal-500/50">
                                            <User size={18} className="text-slate-400" />
                                            <input
                                                autoFocus
                                                className="bg-transparent border-none focus:ring-0 w-full text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                                placeholder="Type name to reassign..."
                                                value={assigneeSearch}
                                                onChange={e => setAssigneeSearch(e.target.value)}
                                            />
                                        </div>

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
                                        <button type="button" onClick={() => setSelectedAssignee(null)} className="p-1 hover:bg-teal-200 rounded-lg text-teal-700"><X size={14} /></button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedAssignee}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Updating...' : 'Confirm Assignment'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReassignModal;
