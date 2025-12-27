import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus, Mail } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

/**
 * External Collaborator Invitation Modal
 * 
 * PURPOSE:
 * Invites external partners to collaborate on specific tasks without full org access.
 * Creates scoped, task-specific access for clients, contractors, or guest reviewers.
 * 
 * SECURITY MODEL:
 * - Invited user sees ONLY the shared tasks (not entire org)
 * - No access to org-wide data, colleagues, or other projects
 * - Invitation links expire after configurable period (e.g., 7 days)
 * - Guest accounts can be revoked at any time
 * 
 * USE CASES:
 * 
 * 1. **Client Collaboration**: Share project tasks with external client
 *    - Example: "Show client their website redesign milestones"
 *    - Scope: Only tasks related to client's project
 * 
 * 2. **Contractor Access**: Grant limited access to freelancer
 *    - Example: "Let contractor update progress on their assigned work"
 *    - Scope: Only tasks contractor is working on
 * 
 * 3. **Guest Review**: Allow stakeholder to review/comment
 *    - Example: "Share deliverable with external reviewer for approval"
 *    - Scope: Read-only or comment-only access
 * 
 * 4. **Bulk Sharing**: Invite one person to multiple related tasks
 *    - Example: "Share all Q1 deliverables with project manager"
 *    - Workflow: Select multiple tasks → Invite → One invitation for all
 * 
 * WORKFLOW:
 * 1. User selects task(s) and clicks "Invite Collaborator"
 * 2. Modal opens, pre-filled with taskId(s) and title(s)
 * 3. User enters external collaborator's email
 * 4. System sends invitation email with unique access link
 * 5. Recipient clicks link, creates guest account (or logs in)
 * 6. Guest sees shared tasks in their scoped view
 * 
 * BULK OPERATION:
 * - Accepts single taskId string OR array of taskIds
 * - Single API call per task: POST /tasks/:id/invite
 * - Promise.all for parallel invitations
 * - Single success toast with count: "Invitation sent to user@example.com for 5 tasks"
 * 
 * API CONTRACT:
 * POST /tasks/:taskId/invite
 * Body: { email: string }
 * 
 * Server creates:
 * - Guest user account (if email doesn't exist)
 * - Task access grant (task_collaborators table)
 * - Invitation email with magic link
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Closes modal and resets form
 * @param {string|Array<string>} taskId - Single task ID or array of IDs for bulk invite
 * @param {string} taskTitle - Task title shown in description (ignored for bulk)
 * 
 * @example
 * // Single task invite
 * <InviteModal
 *   isOpen={showInvite}
 *   onClose={() => setShowInvite(false)}
 *   taskId="task-uuid-123"
 *   taskTitle="Website Redesign Phase 1"
 * />
 * 
 * @example
 * // Bulk invite (multi-select)
 * <InviteModal
 *   isOpen={showBulkInvite}
 *   onClose={() => setShowBulkInvite(false)}
 *   taskId={['task-1', 'task-2', 'task-3']}
 *   taskTitle="" // Ignored for bulk
 * />
 */
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
