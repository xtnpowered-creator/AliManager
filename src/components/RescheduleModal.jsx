import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

const RescheduleModal = ({ isOpen, onClose, onSuccess, taskId, taskTitle, currentDate, onConfirm }) => {
    const { showToast } = useToast();
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    const taskIds = Array.isArray(taskId) ? taskId : [taskId].filter(Boolean);
    const isBulk = taskIds.length > 1;

    useEffect(() => {
        if (isOpen && currentDate && !isBulk) {
            setDate(new Date(currentDate).toISOString().split('T')[0]);
        } else if (isOpen) {
            setDate('');
        }
    }, [isOpen, currentDate, isBulk]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!date || taskIds.length === 0) return;

        // Fix: Construct date in LOCAL time to avoid timezone shift on roundtrip
        const [y, m, d] = date.split('-').map(Number);
        const localDate = new Date(y, m - 1, d);

        setLoading(true);
        try {
            // Optimistic Handler
            if (onConfirm) {
                await onConfirm(new Set(taskIds), { dueDate: localDate.toISOString() });
            } else {
                // Legacy Fallback
                const promises = taskIds.map(id =>
                    apiClient.patch(`/tasks/${id}`, {
                        dueDate: localDate.toISOString()
                    })
                );
                await Promise.all(promises);
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(err);
            showToast("Failed to reschedule task(s)", 'error');
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
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>

                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl"><Calendar size={24} /></div>
                            <h3 className="text-2xl font-bold text-slate-900">{isBulk ? `Reschedule ${taskIds.length} Tasks` : 'Change Date'}</h3>
                        </div>
                        <p className="text-slate-500 font-medium mb-6 line-clamp-1">{isBulk ? `${taskIds.length} items will be moved` : taskTitle}</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">New Due Date</label>
                                <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 ring-teal-500/50">
                                    <input
                                        type="date"
                                        autoFocus
                                        className="bg-transparent border-none focus:ring-0 w-full text-base font-bold text-slate-900"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !date}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Updating...' : 'Confirm Date'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RescheduleModal;
