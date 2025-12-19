import React from 'react';
import { motion } from 'framer-motion';
import { useApiData } from '../hooks/useApiData';
import { Users, Mail, Phone, MoreHorizontal, ShieldCheck } from 'lucide-react';

const Directory = () => {
    const { data: colleagues, loading } = useApiData('/colleagues');
    const { data: tasks } = useApiData('/tasks');

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Directory</h2>
                    <p className="text-slate-500 mt-1 text-lg">Coordinate with your key contacts and check availability.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        Export CSV
                    </button>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
                        + New Entry
                    </button>
                </div>

            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-white rounded-3xl animate-pulse"></div>)
                ) : (
                    colleagues.map(person => {
                        const activeTasks = tasks.filter(t => t.assignedTo?.includes(person.id) && t.status !== 'done').length;

                        return (
                            <motion.div
                                key={person.id}
                                whileHover={{ y: -4 }}
                                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl font-black text-white mb-6 shadow-xl shadow-slate-200">
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
        </div>
    );
};

export default Directory;
