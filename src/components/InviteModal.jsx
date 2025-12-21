import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus, Mail } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

const InviteModal = ({ isOpen, onClose, taskId, taskTitle }) => {
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const taskIds = Array.isArray(taskId) ? taskId : [taskId].filter(Boolean);
    const isBulk = taskIds.length > 1;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || taskIds.length === 0) return;

        setLoading(true);
        setError(null);
        try {
            const promises = taskIds.map(id =>
                apiClient.post(`/tasks/${id}/invite`, { email })
            );
            await Promise.all(promises);
            showToast(`Invitation sent to ${email}${isBulk ? ` for ${taskIds.length} tasks` : ''}`, 'success');
            onClose();
            setEmail('');
        } catch (err) {
            console.error('Failed to invite user:', err);
            setError(err.message || 'Failed to send invitation');
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
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>

                    <div className="p-8">
                        <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-6 mx-auto">
                            <UserPlus size={32} />
                        </div>

                        <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">
                            {isBulk ? `Invite Collaborator to ${taskIds.length} Tasks` : 'Invite Collaborator'}
                        </h3>
                        <p className="text-slate-500 text-center mb-8">
                            Share <strong>{isBulk ? `${taskIds.length} selected tasks` : taskTitle}</strong> with an external partner. They will only see these tasks.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                                <Mail className="text-slate-400" size={20} />
                                <input
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-medium w-full outline-none"
                                    autoFocus
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : (
                                        <>
                                            <span>Send Invite</span>
                                            <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InviteModal;
