import React from 'react';
import { motion } from 'framer-motion';
import { useCollection } from '../hooks/useCollection';
import { FolderKanban, Plus, MoreHorizontal, Target, Calendar } from 'lucide-react';

const ProjectList = () => {
    const { data: projects, loading } = useCollection('projects');
    const { data: tasks } = useCollection('tasks');

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Project Portfolio</h2>
                    <p className="text-slate-500 mt-1 text-lg">High-level oversight of active and planned initiatives.</p>
                </div>
                <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
                    <Plus size={18} />
                    New Project
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-3xl animate-pulse"></div>)
                ) : (
                    projects.map(project => {
                        const projectTasks = tasks.filter(t => t.projectId === project.id);
                        const completed = projectTasks.filter(t => t.status === 'done').length;
                        const progress = projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0;

                        return (
                            <motion.div
                                key={project.id}
                                whileHover={{ y: -4 }}
                                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                        <FolderKanban size={24} />
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-2">{project.title}</h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-2">{project.description}</p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end text-sm">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Progress</span>
                                        <span className="font-bold text-slate-900">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-teal-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center gap-4 pt-6 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Target size={14} />
                                        <span className="text-[10px] font-bold uppercase">{projectTasks.length} Tasks</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar size={14} />
                                        <span className="text-[10px] font-bold uppercase">{project.status}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ProjectList;
