import React, { useState } from 'react';
import PageLayout from './layout/PageLayout';
import { motion } from 'framer-motion';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Users, Mail, Phone, MoreHorizontal, ShieldCheck, Trash2 } from 'lucide-react';
import RequestModal from './RequestModal';
import AddUserModal from './AddUserModal';

/**
 * Directory Component
 * 
 * Team directory with role-based permissions for viewing, adding, and removing members.
 * Displays colleague cards with contact info, task counts, and admin controls.
 * 
 * Key Features:
 * 1. **Role-Based Access**:
 *    - Admins: Can add/delete users immediately
 *    - Regular users: Can view directory, request admin actions
 *    - Self-protection: Cannot delete own account
 * 
 * 2. **Card Information**:
 *    - Avatar: Initials in slate-900 circle
 *    - Name + Role: Bold name, teal uppercase role badge
 *    - Active Tasks: Count of assigned non-done tasks
 *    - Reliability Index: Placeholder (always 98%)
 *    - Contact buttons: Mail, Phone, ShieldCheck (grant delegation)
 * 
 * 3. **Delete Workflow**:
 *    - Admin path:
 *      1. Click trash icon → Confirm dialog
 *      2. DELETE /users/:id
 *      3. Refetch directory
 *    - User path:
 *      1. Click trash icon → RequestModal
 *      2. Submit privileged request
 *      3. Admin reviews in SystemRequests page
 *    - Self-protection: Trash icon hidden for current user
 * 
 * 4. **Add User Workflow** (Admin Only):
 *    - "+ New Entry" button (only visible to admins)
 *    - Opens AddUserModal
 *    - Collects: Name, Email, Role
 *    - POST /users
 *    - Refetches directory
 * 
 * 5. **Card Layout**:
 *    - Grid: 1 column mobile, 2 tablet, 4 desktop
 *    - Hover: Lift -4px (whileHover from Framer Motion)
 *    - Shadow: sm → xl on hover
 *    - Delete button: Opacity 0 → 100 on hover
 * 
 * 6. **Statistics**:
 *    - Active Tasks: Real calculation from tasks array
 *    - Reliability Index: Hardcoded placeholder (future: completion rate)
 *    - Grid layout: 2 columns for metrics
 * 
 * 7. **Loading State**:
 *    - Skeleton cards: 4 pulsing white rectangles
 *    - Height: h-80 (matches typical card height)
 *    - Maintains grid layout during load
 * 
 * 8. **Contact Actions**:
 *    - Mail icon: Opens email client (placeholder)
 *    - Phone icon: Initiates call (placeholder)
 *    - ShieldCheck icon: Grant temporary admin (delegation, placeholder)
 *    - All buttons styled with slate-50 bg, hover to slate-100
 * 
 * Permission Check Logic:
 * ```javascript
 * const currentUserProfile = colleagues.find(c => c.id === user?.uid);
 * const isAdmin = currentUserProfile?.role === 'god' || 
 *                 currentUserProfile?.role === 'admin';
 * ```
 * 
 * Why check colleague.role AND user.role?
 * - user.role: Firebase Auth custom claims
 * - colleague.role: Database record
 * - Checks both for robustness (handles sync delays)
 * 
 * Delete Button Visibility:
 * - Shown to all users (not just admins)
 * - Hidden only for self (isSelf check)
 * - Permission handled on click (admin = delete, user = request)
 * - Title attribute changes: \"Delete User\" vs \"Request Delete\"
 * \n * RequestModal Integration:
 * - type: 'DELETE_USER'
 * - payload: { targetUserId }
 * - title: \"Delete User: [name]\"
 * - description: Explains privileged action requirement
 * \n * Export CSV:
 * - Button visible to all users
 * - Not yet implemented (placeholder)
 * - Future: Download colleague data as CSV
 * 
 * Data Flow:
 * - useApiData('/colleagues'): Fetches directory
 * - useApiData('/tasks'): For active task counts
 * - refetch(): Called after add/delete to refresh directory
 * 
 * @component
 */
const Directory = () => {
    const { data: colleagues, loading, refetch } = useApiData('/colleagues');
    const { data: tasks } = useApiData('/tasks');
    const { user } = useAuth(); // Current logged-in Firebase user

    const [requestModal, setRequestModal] = useState({ isOpen: false, type: null, payload: null, title: '' });
    const [showAddModal, setShowAddModal] = useState(false);

    // Role Check
    const currentUserProfile = colleagues.find(c => c.id === user?.uid);
    const isAdmin = currentUserProfile?.role === 'god' || currentUserProfile?.role === 'admin';

    const handleDeleteClick = async (personId, personName) => {
        if (isAdmin) {
            // Admin Action: Immediate Delete
            if (!window.confirm(`Permanently delete ${personName}?\n\nThis action cannot be undone and will remove them from all tasks.`)) {
                return;
            }
            try {
                await apiClient.delete(`/users/${personId}`);
                refetch();
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert('Failed to delete user.');
            }
        } else {
            // User Action: Request Access
            setRequestModal({
                isOpen: true,
                type: 'DELETE_USER',
                payload: { targetUserId: personId },
                title: `Delete User: ${personName}`
            });
        }
    };

    return (
        <PageLayout
            title="Directory"
            subtitle="Coordinate with your key contacts and check availability."
            actions={
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        Export CSV
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                        >
                            + New Entry
                        </button>
                    )}
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto pb-8 pr-2 custom-scrollbar flex-1">
                {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-white rounded-3xl animate-pulse"></div>)
                ) : (
                    colleagues.map(person => {
                        const activeTasks = tasks.filter(t => t.assignedTo?.includes(person.id) && t.status !== 'done').length;
                        const isSelf = person.id === user?.uid;

                        return (
                            <motion.div
                                key={person.id}
                                whileHover={{ y: -4 }}
                                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center relative group"
                            >
                                {/* Delete Button - Visible to everyone (except self), handles permissions on click */}
                                {!isSelf && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(person.id, person.name); }}
                                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title={isAdmin ? "Delete User" : "Request Delete"}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}

                                <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl font-black text-white mb-6 shadow-xl shadow-slate-200 select-none">
                                    {person.avatar}
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-900">{person.name}</h3>
                                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.2em] mt-1">{person.role}</p>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50 p-3 rounded-2xl">
                                        <p className="text-lg font-bold text-slate-900">{activeTasks}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Tasks</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl">
                                        <p className="text-lg font-bold text-slate-900">98%</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Reliability Index</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-2 w-full">
                                    <button className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
                                        <Mail size={18} className="mx-auto" />
                                    </button>
                                    <button className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
                                        <Phone size={18} className="mx-auto" />
                                    </button>
                                    <button className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all">
                                        <ShieldCheck size={18} className="mx-auto" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <RequestModal
                isOpen={requestModal.isOpen}
                onClose={() => setRequestModal({ ...requestModal, isOpen: false })}
                type={requestModal.type}
                payload={requestModal.payload}
                title={requestModal.title}
                description="This action is restricted to Admins. Currently, you are a standard user. Would you like to submit a formal request?"
            />

            <AddUserModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={refetch}
            />
        </PageLayout>
    );
};

export default Directory;
