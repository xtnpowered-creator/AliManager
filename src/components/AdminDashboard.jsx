import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiData } from '../hooks/useApiData';
import { apiClient } from '../api/client';
import { ShieldAlert, Check, X, Clock, Trash2, UserCog, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
    const { data: requests, loading, refetch } = useApiData('/requests?status=PENDING');
    const [processing, setProcessing] = useState(null); // id of request being processed

    const handleResolve = async (id, status) => {
        setProcessing(id);
        try {
            await apiClient.patch(`/requests/${id}/resolve`, {
                status,
                admin_notes: status === 'APPROVED' ? 'Approved by Admin' : 'Rejected by Admin'
            });
            refetch();
        } catch (error) {
            console.error(`Failed to ${status} request:`, error);
            alert(`Failed to ${status} request.`);
        } finally {
            setProcessing(null);
        }
    };

    const getRequestIcon = (type) => {
        switch (type) {
            case 'DELETE_USER': return <Trash2 size={20} />;
            case 'REASSIGN_TASK': return <UserCog size={20} />;
            default: return <ShieldAlert size={20} />;
        }
    };

    const getRequestTitle = (req) => {
        switch (req.type) {
            case 'DELETE_USER': return 'Delete User Request';
            case 'REASSIGN_TASK': return 'Task Reassignment';
            default: return 'System Request';
        }
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <ShieldAlert className="text-teal-600" size={32} />
                    Admin Command Center
                </h2>
                <p className="text-slate-500 text-lg">Review and approve restricted actions from your team.</p>
            </header>

            <div className="flex gap-6">
                {/* Stats / Overview could go here */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col text-center items-center justify-center gap-2">
                    <h3 className="text-4xl font-black text-slate-900">{requests.length}</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-teal-600">Pending Requests</p>
                </div>
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col text-center items-center justify-center gap-2">
                    <h3 className="text-4xl font-black text-slate-900">0</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-teal-600">System Alerts</p>
                </div>
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col text-center items-center justify-center gap-2">
                    <h3 className="text-4xl font-black text-slate-900">100%</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-teal-600">Uptime</p>
                </div>
            </div>

            <main className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Clock className="text-slate-400" size={18} />
                        Pending Inbox
                    </h3>
                    <button onClick={refetch} className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar">
                    <AnimatePresence>
                        {loading ? (
                            <div className="text-center py-10 text-slate-400">Loading requests...</div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center gap-4 text-slate-400">
                                <Check size={48} className="text-teal-500 bg-teal-50 p-3 rounded-2xl" />
                                <p>All caught up! No pending requests.</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex items-center gap-6 group hover:border-slate-300 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm shrink-0">
                                        {getRequestIcon(req.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-slate-900">{getRequestTitle(req)}</h4>
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1 font-medium text-slate-700">
                                                <img src={req.requester_avatar || 'https://ui-avatars.com/api/?name=User'} alt="" className="w-4 h-4 rounded-full" />
                                                {req.requester_name || 'Unknown User'}
                                            </span>
                                            <span>requested to</span>
                                            <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                {JSON.stringify(req.payload)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(req.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleResolve(req.id, 'REJECTED')}
                                            disabled={!!processing}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            Deny
                                        </button>
                                        <button
                                            onClick={() => handleResolve(req.id, 'APPROVED')}
                                            disabled={!!processing}
                                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all disabled:opacity-50"
                                        >
                                            {processing === req.id ? '...' : 'Approve'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
