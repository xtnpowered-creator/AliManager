import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserMinus, UserPlus, X } from 'lucide-react';

const AssignmentConflictModal = ({ isOpen, onClose, onReassign, onAdd, colleagueName }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[10000] pointer-events-none p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto border border-slate-100"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
                                        <Users size={24} strokeWidth={2.5} />
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                                    Update Assignment
                                </h3>
                                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                    You moved this task to <span className="text-slate-900 font-bold">{colleagueName}</span>'s timeline. How would you like to handle this assignment?
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={onReassign}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 transition-all group"
                                    >
                                        <span className="font-bold tracking-wide text-sm">REASSIGN TASK</span>
                                        <UserMinus size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                                    </button>

                                    <button
                                        onClick={onAdd}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 hover:border-teal-500 hover:text-teal-600 transition-all group"
                                    >
                                        <span className="font-bold tracking-wide text-sm">ADD AS CO-ASSIGNEE</span>
                                        <UserPlus size={18} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 text-center">
                                <button
                                    onClick={onClose}
                                    className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AssignmentConflictModal;
