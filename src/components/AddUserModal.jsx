import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, User } from 'lucide-react';
import { apiClient } from '../api/client';

/**
 * AddUserModal Component
 * 
 * Simple user creation form for adding colleagues to the directory.
 * Used by admins from Directory page "+ New Entry" button.
 * 
 * Features:
 * - **Two-field form**: Name (required) + Email (required)
 * - **Instant availability**: New users immediately available for assignment
 * - **Error display**: Shows API error messages inline
 * - **Loading state**: "Adding..." button text, disabled during submit
 * 
 * Form Fields:
 * - **Name**: Full name (autofocus, text input with User icon)
 * - **Email**: Valid email (Mail icon, HTML5 validation)
 * - Both fields required for submission
 * 
 * Visual Design:
 * - Teal UserPlus icon badge (centered)
 * - Slate-50 input backgrounds with icons
 * - Focus rings: Teal-500/20 with border transition
 * - Two-button layout: Cancel + Add Person
 * 
 * API Flow:
 * 1. User fills name + email
 * 2. Submit → POST /users { email, name }
 * 3. Success → onSuccess callback (refetch directory)
 * 4. Close → Reset form fields
 * 5. Error → Display inline (red-50 background)
 * 
 * Error Handling:
 * - Try/catch displays error.message
 * - Finally block ensures loading state clears
 * - Form fields reset only on success
 * 
 * Integration Points:
 * - **Directory page**: Admin-only button
 * - **NewTaskModal**: Inline creation (different implementation)
 * - **ReassignModal**: Inline creation (different implementation)
 * 
 * Why Separate Modal:
 * - Directory uses full modal for explicit add action
 * - Task modals use inline creation for workflow continuity
 * - Same API endpoint, different UX contexts
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} [props.onSuccess] - Success callback (refetch directory)
 * @component
 */
const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !name) return;

        setLoading(true);
        setError(null);
        try {
            await apiClient.post('/users', { email, name });
            onSuccess?.();
            onClose();
            setName('');
            setEmail('');
        } catch (err) {
            console.error('Failed to add user:', err);
            setError(err.message || 'Failed to add user');
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
                            Add to Directory
                        </h3>
                        <p className="text-slate-500 text-center mb-8">
                            Create a new entry for a colleague or partner. They will be available for assignment immediately.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                                <User className="text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-medium w-full outline-none"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                                <Mail className="text-slate-400" size={20} />
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-medium w-full outline-none"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
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
                                    {loading ? 'Adding...' : 'Add Person'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddUserModal;
