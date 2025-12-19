import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ShieldAlert } from 'lucide-react';
import { apiClient } from '../api/client';

const RequestModal = ({ isOpen, onClose, type, payload, title, description, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.post('/requests', {
                type,
                payload
            });
            onSuccess?.();
            onClose();
            alert('Request sent to Admin successfully.');
        } catch (err) {
            console.error('Failed to submit request:', err);
            setError(err.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>

                    <div className="p-8">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 mx-auto">
                            <ShieldAlert size={32} />
                        </div>

                        <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">
                            Permission Required
                        </h3>
                        <p className="text-slate-500 text-center mb-8">
                            {description || "You don't have permission to perform this action directly. Would you like to submit a request to the Admin?"}
                        </p>

                        <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-200">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Action</p>
                            <p className="font-bold text-slate-900">{title}</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : (
                                    <>
                                        <span>Send Request</span>
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RequestModal;
