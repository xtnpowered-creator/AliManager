import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertTriangle } from 'lucide-react';

/**
 * DeleteTaskModal Component
 * 
 * Confirmation dialog for deleting one or multiple tasks.
 * Shows warning message with count and requires explicit confirmation.
 * 
 * Features:
 * - **Bulk support**: Handles single or multiple task deletion
 * - **Loading state**: Shows "Deleting..." during API call
 * - **Destructive styling**: Red color scheme for danger action
 * - **Irreversible warning**: "This action cannot be undone"
 * 
 * Visual Design:
 * - Red Trash2 icon in circular background
 * - Dynamic title: "Delete Task" vs "Delete Tasks"
 * - Count display:  "1 item" vs "N items"
 * - Two-button layout: Cancel (gray) + Delete (red)
 * 
 * Flow:
 * 1. User clicks delete (from context menu, selection)
 * 2. Modal opens with task count
 * 3. User confirms → handleConfirm
 * 4. Loading state (disabled button)
 * 5. onConfirm callback → API deletion
 * 6. Modal closes (finally block)
 * 
 * Error Handling:
 * - Try/finally ensures modal closes even on error
 * - Parent (onConfirm) handles error toasts
 * - Loading state prevents double-submission
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Async delete handler
 * @param {number} [props.taskCount=1] - Number of tasks being deleted
 * @component
 */
const DeleteTaskModal = ({ isOpen, onClose, onConfirm, taskCount = 1 }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
            onClose();
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

                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Task{taskCount > 1 ? 's' : ''}?</h3>
                        <p className="text-slate-500 font-medium mb-8">
                            Are you sure you want to delete <strong className="text-slate-900">{taskCount} {taskCount > 1 ? 'items' : 'item'}</strong>? This action cannot be undone.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DeleteTaskModal;
