import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Clock, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

/**
 * Temporary Admin Delegation Modal
 * 
 * PURPOSE:
 * Allows admins to temporarily grant full admin privileges to another colleague.
 * Used for coverage during vacation, training new admins, or handling specific tasks.
 * 
 * SECURITY MODEL:
 * - Time-limited access (1-365 days)
 * - Explicit warning about full admin privileges
 * - Delegation is logged and auditable
 * - Auto-revokes after expiration (server-side enforcement)
 * 
 * USE CASES:
 * 1. **Vacation Coverage**: Admin going on leave, delegate to trusted colleague
 * 2. **Admin Training**: Temporary access to learn admin workflows
 * 3. **Project-Specific**: Grant access for specific high-priority tasks
 * 4. **Emergency Access**: Quick delegation during urgent situations
 * 
 * WORKFLOW:
 * 1. Admin clicks "Delegate Access" in Directory/Admin view
 * 2. Modal opens with selected colleague pre-filled
 * 3. Admin sets duration (default: 7 days)
 * 4. Warning message confirms colleague's full access scope
 * 5. On submit, POST to /delegations with colleagueId + duration
 * 6. Server creates delegation record with expiration date
 * 7. Colleague immediately gains admin privileges
 * 
 * API CONTRACT:
 * POST /delegations
 * Body: { delegateId: string, days: number }
 * - Creates delegation record in database
 * - Sets expiration_date = NOW() + days
 * - Grants admin role to delegate
 * 
 * DESIGN RATIONALE:
 * - Amber color scheme signals caution/warning (not destructive, but important)
 * - Number input allows precise duration control
 * - Alert box with colleague name prevents accidental delegation
 * - Portal render ensures z-index above all content
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Closes modal without changes
 * @param {Object} colleague - Colleague to delegate to (requires: id, name)
 * @param {Function} onSuccess - Callback after successful delegation (refreshes UI)
 * 
 * @example
 * // From Directory or Admin Dashboard
 * <DelegationModal
 *   isOpen={showDelegationModal}
 *   onClose={() => setShowDelegationModal(false)}
 *   colleague={{ id: "uuid-123", name: "Alice Johnson" }}
 *   onSuccess={() => refetchDelegations()}
 * />
 */
const DelegationModal = ({ isOpen, onClose, colleague, onSuccess }) => {
    const { showToast } = useToast();
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !colleague) return null;

    const handleGrant = async () => {
        setLoading(true);
        try {
            await apiClient.post('/delegations', {
                delegateId: colleague.id,
                days: parseInt(days)
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Delegation failed:', err);
            showToast('Failed to grant delegation. See console.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 rounded-lg border border-amber-200 shadow-sm text-amber-700">
                            <Shield size={18} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-bold text-slate-900">Delegate Admin Access</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-amber-900">
                            You are about to grant <span className="font-bold">{colleague.name}</span> full Admin privileges.
                            They will have access to all organization settings and dashboards.
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration (Days)</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={days}
                                onChange={e => setDays(e.target.value)}
                                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                            <div className="text-sm font-bold text-slate-400">Days</div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGrant}
                            disabled={loading}
                            className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Granting...' : 'Grant Access'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default DelegationModal;
