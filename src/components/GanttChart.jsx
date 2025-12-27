import React from 'react';
import PageLayout from './layout/PageLayout';
import { motion } from 'framer-motion';
import { useCollection } from '../hooks/useCollection';
import { BarChart3, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * GanttChart Component
 * 
 * Project timeline view showing task durations and dependencies across calendar.
 * Displays tasks grouped by project with horizontal bars indicating task span.
 * 
 * Timeline Features:
 * - **30-day window**: Shows 5 days past → 25 days future
 * - **Day columns**: Date headers with weekday/day number
 * - **Today indicator**: Teal highlight on current date
 * - **Project grouping**: Tasks nested under parent projects
 * 
 * Task Bar Visualization:
 * - **Assumed duration**: 3 days (task.dueDate - 3 → dueDate)
 * - **Color by status**:
 *   - done: Teal (teal-100 border-teal-200)
 *   - doing: Blue (blue-100 border-blue-200)
 *   - todo: Slate (slate-100 border-slate-200)
 * - **Position**: Calculated by finding start date in days array
 * - **Width**: Fixed 120px (3 days × 40px)
 * - **Animation**: Framer Motion width + opacity on mount
 * 
 * View Controls:
 * - **Month/Quarter toggle**: Currently Month is active (Quarter not implemented)
 * - **Navigation arrows**: Left/right chevrons (not yet functional)
 * - **Time period**: Hardcoded to 30 days (no actual scroll/nav)
 * 
 * Data Structure:
 * - useCollection('tasks'): Fetches all tasks, ordered by dueDate
 * - useCollection('projects'): Fetches projects for grouping
 * - getTaskSpan(task): Calculates assumed start/end dates
 * 
 * Limitations:
 * - **No dependencies**: Doesn't show task relationships
 * - **No critical path**: Doesn't calculate/highlight critical tasks
 * - **Fixed duration**: All tasks assumed 3 days
 * - **No dragging**: Bars not interactive
 * - **No zoom**: Can't change time scale
 * - **Hardcoded window**: Always shows same 30-day range
 * 
 * Layout:
 * - **Left column**: 256px (w-64) for project/task names
 * - **Timeline area**: Scrollable horizontally (overflow-x-auto)
 * - **Row height**: Varies by content (project rows vs task rows)
 * - **Day columns**: 40px width (min-w-[40px])
 * 
 * Visual Design:
 * - Project rows: bg-slate-50/80 (lighter background for hierarchy)
 * - Project indicator: Teal dot next to title
 * - Task rows: Indented 40px (pl-10) to show nesting
 * - Hover state: bg-slate-50/30 on task rows
 * - Grid lines: border-slate-200 between rows, border-slate-300 for columns
 * 
 * Why This Approach:
 * - Simple implementation without complex dependency libraries
 * - Visual MVP for stakeholder communication
 * - Foundation for future enhancements (real duration, dependencies)
 * 
 * @component
 */
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
        <PageLayout
            title="Gantt & Dependencies"
            subtitle="Project timelines and critical path delivery."
            actions={
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-300 text-sm font-bold"> {/* Updated border to 300 */}
                        <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg">Month</button>
                        <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-all">Quarter</button>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 bg-white border border-slate-300 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <button className="p-2 bg-white border border-slate-300 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex-1 bg-white rounded-3xl border border-slate-300 shadow-sm flex flex-col overflow-hidden"> {/* Updated border to 300 */}
                {/* Timeline Header */}
                <div className="flex border-b border-slate-300 bg-slate-50/50">
                    <div className="w-64 p-6 border-r border-slate-300 font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center">
                        Project / Task
                    </div>
                    <div className="flex-1 overflow-x-auto flex invisible-scrollbar">
                        {days.map((day, i) => (
                            <div key={i} className="min-w-[40px] h-16 flex flex-col items-center justify-center border-r border-slate-300/50">
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
                            <div className="flex bg-slate-50/80 border-b border-slate-300">
                                <div className="w-64 p-4 border-r border-slate-300 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                    <span className="font-bold text-slate-800 text-sm uppercase tracking-tight">{project.title}</span>
                                </div>
                                <div className="flex-1"></div>
                            </div>
                            {tasks.filter(t => t.projectId === project.id).map(task => {
                                const { start, end } = getTaskSpan(task);
                                return (
                                    <div key={task.id} className="flex border-b border-slate-200 group hover:bg-slate-50/30">
                                        <div className="w-64 p-4 border-r border-slate-300 pl-10">
                                            <p className="font-medium text-slate-600 text-sm line-clamp-1">{task.title}</p>
                                        </div>
                                        <div className="flex-1 relative flex items-center overflow-x-auto invisible-scrollbar">
                                            {days.map((day, i) => (
                                                <div key={i} className="min-w-[40px] h-full border-r border-slate-200/50"></div>
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
        </PageLayout>
    );
};

export default GanttChart;
