import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Users, Activity, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';

const Dashboard = () => {
    const { data: tasks, loading: tasksLoading } = useApiData('/tasks');
    const { data: projects, loading: projectsLoading } = useApiData('/projects');
    const { data: colleagues } = useApiData('/colleagues');

    const stats = {
        totalTasks: tasks.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        teamSize: colleagues.length,
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-16">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Project Oversight</h2>
                    <p className="text-slate-500 mt-1 text-lg">Manage your team's workflow and task delivery.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        Generate Report
                    </button>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                        + New Task
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Tasks" value={stats.totalTasks} change="+2 new" trend="up" icon={<Activity size={20} />} />
                <KPICard title="Active Projects" value={stats.activeProjects} change="Current" trend="up" icon={<Zap size={20} />} />
                <KPICard title="Completed" value={stats.completedTasks} change={`${tasks.length - stats.completedTasks} pending`} trend="down" icon={<CheckCircle2 size={20} />} />
                <KPICard title="Colleagues" value={stats.teamSize} change="Active" trend="up" icon={<Users size={20} />} />
            </div>

            {/* Timeline Summary */}
            <section className="bg-slate-900 rounded-3xl p-8 text-white overflow-hidden relative">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold">Weekly Velocity</h3>
                            <p className="text-slate-400 text-sm">Real-time delivery pulse across all streams.</p>
                        </div>
                        <div className="flex -space-x-3">
                            {colleagues.map(c => (
                                <div key={c.id} className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold uppercase">
                                    {c.avatar}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 invisible-scrollbar">
                        {Array.from({ length: 7 }, (_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() + i);
                            const dayTasks = tasks.filter(t => t.dueDate.split('T')[0] === date.toISOString().split('T')[0]);
                            return (
                                <div key={i} className="min-w-[140px] flex-1 bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <p className="text-lg font-bold mb-3">{date.getDate()}</p>
                                    <div className="space-y-1.5">
                                        {dayTasks.length > 0 ? (
                                            dayTasks.map(t => (
                                                <div key={t.id} className="h-1.5 w-full bg-teal-500 rounded-full opacity-80" title={t.title}></div>
                                            ))
                                        ) : (
                                            <div className="h-1.5 w-8 bg-slate-700 rounded-full opacity-30"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none"></div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task List Section */}
                <section className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-xl text-slate-800">Upcoming Deliverables</h3>
                        <div className="text-sm font-semibold text-teal-600 cursor-pointer hover:underline">View Calendar</div>
                    </div>

                    <div className="space-y-4">
                        {tasksLoading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl w-full"></div>)}
                            </div>
                        ) : (
                            tasks.slice(0, 5).map(task => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${task.priority === 'high' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'}`}>
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">{task.title}</h4>
                                            <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {task.assignedTo?.map(id => {
                                                const colleague = colleagues.find(c => c.id === id);
                                                return colleague ? (
                                                    <div key={id} className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white uppercase" title={colleague.name}>
                                                        {colleague.avatar}
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${task.status === 'done' ? 'bg-teal-100 text-teal-700' :
                                            task.status === 'doing' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-200 text-slate-600'
                                            }`}>
                                            {task.status}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Project Feed */}
                <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h3 className="font-bold text-xl text-slate-800 mb-6">Active Projects</h3>
                    <div className="space-y-6">
                        {projectsLoading ? (
                            <div className="animate-pulse space-y-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl w-full"></div>)}
                            </div>
                        ) : (
                            projects.map(project => (
                                <div key={project.id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-slate-800">{project.title}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.status}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500 rounded-full" style={{ width: '65%' }}></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="w-full mt-8 py-3 bg-slate-50 text-slate-500 text-sm font-bold rounded-2xl hover:bg-slate-100 transition-colors uppercase tracking-widest">
                        Manage All Projects
                    </button>
                </section>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, change, trend, icon }) => (
    <motion.div
        whileHover={{ y: -4 }}
        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                {icon}
            </div>
            <div className={`flex items-center gap-0.5 text-xs font-bold ${trend === 'up' ? 'text-teal-600' : 'text-amber-600'}`}>
                {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {change}
            </div>
        </div>
        <div className="space-y-1">
            <h4 className="text-sm font-medium text-slate-400 leading-none">{title}</h4>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
    </motion.div>
);

export default Dashboard;
