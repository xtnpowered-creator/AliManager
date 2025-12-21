import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarRange, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

const MoveDateModal = ({ isOpen, onClose, onSuccess, tasks, selectedTaskIds, onConfirm }) => {
    const { showToast } = useToast();
    const [days, setDays] = useState(1);
    const [direction, setDirection] = useState('later'); // 'earlier' or 'later'
    const [loading, setLoading] = useState(false);

    const taskIds = Array.isArray(selectedTaskIds) ? selectedTaskIds : Array.from(selectedTaskIds || []);
    const isBulk = taskIds.length > 1;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!days || taskIds.length === 0) return;

        setLoading(true);
        try {
            // Use the passed handler (Optimistic Update)
            if (onConfirm) {
                await onConfirm(taskIds, days, direction);
            } else {
                // Fallback (Legacy)
                const promises = taskIds.map(id => {
                    const task = tasks.find(t => t.id === id);
                    if (!task || !task.dueDate) return Promise.resolve();
                    const currentDate = new Date(task.dueDate);
                    const shift = direction === 'later' ? days : -days;
                    currentDate.setDate(currentDate.getDate() + shift);
                    return apiClient.patch(`/tasks/${id}`, { dueDate: currentDate.toISOString() });
                });
                await Promise.all(promises);
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("Failed to move dates:", err);
            showToast("Failed to update task dates", 'error');
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
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>

                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl"><CalendarRange size={24} /></div>
                            <h3 className="text-2xl font-bold text-slate-900">Shift Schedule</h3>
                        </div>
                        <p className="text-slate-500 font-medium mb-8">
                            Move {isBulk ? <strong>{taskIds.length} tasks</strong> : 'task'} by a specific amount.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Number of Days</label>
                                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setDays(Math.max(1, days - 1))}
                                            className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-50 active:scale-95 transition-all shadow-sm font-black"
                                        >-</button>
                                        <input
                                            type="number"
                                            min="1"
                                            className="bg-transparent border-none focus:ring-0 w-full text-center text-2xl font-black text-slate-900"
                                            value={days}
                                            onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 0))}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setDays(days + 1)}
                                            className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-50 active:scale-95 transition-all shadow-sm font-black"
                                        >+</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Direction</label>
                                    <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setDirection('earlier')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${direction === 'earlier' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                                        >
                                            <ArrowLeft size={18} />
                                            Earlier
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDirection('later')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${direction === 'later' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                                        >
                                            Later
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 group"
                            >
                                {loading ? 'Updating...' : (
                                    <>
                                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                                        Confirm Shift
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MoveDateModal;
