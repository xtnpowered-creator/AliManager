import React from 'react';
import { motion } from 'framer-motion';
import { useCollection } from '../hooks/useCollection';
import { BarChart3, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const GanttChart = () => {
    const { data: tasks, loading: tasksLoading } = useCollection('tasks', 'dueDate');
    const { data: projects } = useCollection('projects');

    // Simple Gantt Logic: Map tasks over 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 5 + i); // Start from 5 days ago
        return date;
    });

    const getTaskSpan = (task) => {
        const start = new Date(task.dueDate);
        start.setDate(start.getDate() - 3); // Assume 3 days duration for visualization
        return { start, end: new Date(task.dueDate) };
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6 overflow-hidden">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Gantt & Dependencies</h2>
                    <p className="text-slate-500 mt-1 text-lg">Project timelines and critical path delivery.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 text-sm font-bold">
                        <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg">Month</button>
                        <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-all">Quarter</button>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Timeline Header */}
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <div className="w-64 p-6 border-r border-slate-100 font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center">
                        Project / Task
                    </div>
                    <div className="flex-1 overflow-x-auto flex invisible-scrollbar">
                        {days.map((day, i) => (
                            <div key={i} className="min-w-[40px] h-16 flex flex-col items-center justify-center border-r border-slate-100/50">
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">{day.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                <span className={`text-xs font-bold mt-1 ${day.toDateString() === new Date().toDateString() ? 'text-teal-600' : 'text-slate-500'}`}>
                                    {day.getDate()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart Rows */}
                <div className="flex-1 overflow-y-auto">
                    {projects.map(project => (
                        <React.Fragment key={project.id}>
                            <div className="flex bg-slate-50/80 border-b border-slate-100">
                                <div className="w-64 p-4 border-r border-slate-100 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                    <span className="font-bold text-slate-800 text-sm uppercase tracking-tight">{project.title}</span>
                                </div>
                                <div className="flex-1"></div>
                            </div>
                            {tasks.filter(t => t.projectId === project.id).map(task => {
                                const { start, end } = getTaskSpan(task);
                                return (
                                    <div key={task.id} className="flex border-b border-slate-50 group hover:bg-slate-50/30">
                                        <div className="w-64 p-4 border-r border-slate-100 pl-10">
                                            <p className="font-medium text-slate-600 text-sm line-clamp-1">{task.title}</p>
                                        </div>
                                        <div className="flex-1 relative flex items-center overflow-x-auto invisible-scrollbar">
                                            {days.map((day, i) => (
                                                <div key={i} className="min-w-[40px] h-full border-r border-slate-50/50"></div>
                                            ))}
                                            <motion.div
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: 120, opacity: 1 }}
                                                className={`absolute h-6 rounded-lg border shadow-sm ${task.status === 'done' ? 'bg-teal-100 border-teal-200' :
                                                        task.status === 'doing' ? 'bg-blue-100 border-blue-200' :
                                                            'bg-slate-100 border-slate-200'
                                                    }`}
                                                style={{
                                                    left: `${(days.findIndex(d => d.toDateString() === start.toDateString()) * 40) + 10}px`
                                                }}
                                            >
                                                <div className="w-full h-full flex items-center px-2">
                                                    <span className={`text-[8px] font-bold uppercase truncate ${task.status === 'done' ? 'text-teal-700' :
                                                            task.status === 'doing' ? 'text-blue-700' :
                                                                'text-slate-500'
                                                        }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
