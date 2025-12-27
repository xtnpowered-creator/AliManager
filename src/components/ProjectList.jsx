import React from 'react';
import PageLayout from './layout/PageLayout';
import { motion } from 'framer-motion';
import { useApiData } from '../hooks/useApiData';
import { FolderKanban, Plus, MoreHorizontal, Target, Calendar } from 'lucide-react';

import Card from './common/Card';

/**
 * ProjectList Component
 * 
 * Grid view of all projects with progress tracking and task counts.
 * Displays project overview cards with completion percentages.
 * 
 * Card Features:
 * - **Icon badge**: FolderKanban icon (teal, transitions to white on hover)
 * - **Title + Description**: Project name and 2-line clamped description
 * - **Progress bar**: Animated teal bar showing completion (done tasks / total tasks)
 * - **Task count**: Total tasks associated with project
 * - **Status badge**: Project status (active, completed, etc.)
 * - **Options menu**: MoreHorizontal icon (placeholder, not yet functional)
 * 
 * Progress Calculation:
 * ```javascript
 * const projectTasks = tasks.filter(t => t.projectId === project.id);
 * const completed = projectTasks.filter(t => t.status === 'done').length;
 * const progress = (completed / projectTasks.length) * 100;
 * ```
 * 
 * Layout:
 * - Grid: 1 column mobile, 2 tablet, 3 desktop
 * - Card variant: MACRO (large dashboard cards)
 * - Loading state: 3 pulsing skeleton cards (h-64)
 * 
 * Interactions:
 * - Card click: Placeholder (onClick empty function)
 * - "+ New Project" button: Not yet implemented
 * - Options menu: Not yet functional
 * 
 * Visual Design:
 * - Icon hover: bg-teal-50 → bg-teal-500, text-teal-600 → text-white
 * - Progress bar: Framer Motion animated width
 * - Footer: Border-top divider with metadata row
 * 
 * Data Flow:
 * - useApiData('/projects'): Fetches all projects
 * - useApiData('/tasks'): For calculating progress per project
 * - Cross-references projectId to count tasks
 * 
 * Why "Lone Tasks" vs "Projects":
 * - Projects: Grouped tasks with shared goals/timelines
 * - Lone Tasks: Single-event tasks not tied to projects
 * - Helps organize work into campaigns vs one-offs
 * 
 * @component
 */
const ProjectList = () => {
    const { data: projects, loading } = useApiData('/projects');
    const { data: tasks } = useApiData('/tasks');

    return (
        <PageLayout
            title="Projects"
            subtitle="High-level oversight of active and planned initiatives."
            actions={
                <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
                    <Plus size={18} />
                    New Project
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-8 pr-2 custom-scrollbar flex-1">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse"></div>)
                ) : (
                    projects.map(project => {
                        const projectTasks = tasks.filter(t => t.projectId === project.id);
                        const completed = projectTasks.filter(t => t.status === 'done').length;
                        const progress = projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0;

                        return (
                            <Card
                                key={project.id}
                                variant="MACRO"
                                className="p-8 group"
                                onClick={() => { }} // Make interactive
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
                            </Card>
                        );
                    })
                )}
            </div>
        </PageLayout>
    );
};

export default ProjectList;
