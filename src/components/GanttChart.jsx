import React from 'react';
import PageLayout from './layout/PageLayout';
import { motion } from 'framer-motion';
import { useApiData } from '../hooks/useApiData';
import { useBoardFilters } from '../hooks/useBoardFilters';
import FilterAndSortToolbar from './shared/filters/FilterAndSortToolbar';
import { BarChart3, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const GanttChart = () => {
    const { data: tasks, loading: tasksLoading } = useApiData('/tasks');
    const { data: projects } = useApiData('/projects');
    const { data: colleagues } = useApiData('/colleagues');
    const filters = useBoardFilters(tasks, colleagues, projects);
    const [anchorDate, setAnchorDate] = React.useState(() => new Date());
    const [rangeDays, setRangeDays] = React.useState(30);
    const chartRef = React.useRef(null);
    const syncScroll = event => {
        const source = event.currentTarget;
        chartRef.current?.querySelectorAll('[data-date-scroll]').forEach(element => {
            if (element !== source && element.scrollLeft !== source.scrollLeft) element.scrollLeft = source.scrollLeft;
        });
    };
    const navigate = amount => setAnchorDate(current => { const next = new Date(current); next.setDate(next.getDate() + amount); return next; });
    const firstMatch = () => {
        const dated = filters.visibleTasks.filter(t => t.dueDate && !Number.isNaN(new Date(t.dueDate).getTime())).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        if (dated.length) setAnchorDate(new Date(dated[0].dueDate));
    };
    const groups = [...projects, { id: null, title: 'Standalone Tasks' }].filter(project =>
        !filters.hideEmptyRows || filters.visibleTasks.some(t => t.projectId === project.id || (!project.id && !t.projectId)));

    // Simple Gantt Logic: Map tasks over 30 days
    const days = Array.from({ length: rangeDays }, (_, i) => {
        const date = new Date(anchorDate);
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
                    <button onClick={() => setAnchorDate(new Date())} className="px-4 py-2 bg-teal-50 border border-teal-300 rounded-lg text-xs font-black text-teal-900">TODAY</button>
                    <button onClick={firstMatch} disabled={!filters.hasFilters || !filters.visibleTasks.some(t => t.dueDate)} className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-black disabled:opacity-40">FIRST MATCH</button>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-300 text-sm font-bold"> {/* Updated border to 300 */}
                        <button onClick={() => setRangeDays(30)} className={`px-3 py-1.5 rounded-lg ${rangeDays === 30 ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Month</button>
                        <button onClick={() => setRangeDays(90)} className={`px-3 py-1.5 rounded-lg ${rangeDays === 90 ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Quarter</button>
                    </div>
                    <div className="flex items-center gap-1">
                        <button aria-label="Previous period" onClick={() => navigate(-rangeDays)} className="p-2 bg-white border border-slate-300 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <button aria-label="Next period" onClick={() => navigate(rangeDays)} className="p-2 bg-white border border-slate-300 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            }
            filters={<FilterAndSortToolbar tasks={tasks} colleagues={colleagues} projectsData={projects} {...filters} showProjectControls showSortControls={false} />}
        >
            <div ref={chartRef} className="flex-1 bg-white rounded-3xl border border-slate-300 shadow-sm flex flex-col overflow-hidden"> {/* Updated border to 300 */}
                {/* Timeline Header */}
                <div className="flex border-b border-slate-300 bg-slate-50/50">
                    <div className="w-64 p-6 border-r border-slate-300 font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center">
                        Project / Task
                    </div>
                    <div data-date-scroll onScroll={syncScroll} className="flex-1 overflow-x-auto flex invisible-scrollbar">
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
                    {tasksLoading && <p className="p-4 text-slate-500">Loading tasks...</p>}
                    {groups.map(project => (
                        <React.Fragment key={project.id || 'standalone'}>
                            <div className="flex bg-slate-50/80 border-b border-slate-300">
                                <div className="w-64 p-4 border-r border-slate-300 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                    <span className="font-bold text-slate-800 text-sm uppercase tracking-tight">{project.title}</span>
                                </div>
                                <div className="flex-1"></div>
                            </div>
                            {filters.visibleTasks.filter(t => t.projectId === project.id || (!project.id && !t.projectId)).map(task => {
                                const { start, end } = getTaskSpan(task);
                                return (
                                    <div key={task.id} className="flex border-b border-slate-200 group hover:bg-slate-50/30">
                                        <div className="w-64 p-4 border-r border-slate-300 pl-10">
                                            <p className="font-medium text-slate-600 text-sm line-clamp-1">{task.title}</p>
                                        </div>
                                        <div data-date-scroll onScroll={syncScroll} className="flex-1 relative flex items-center overflow-x-auto invisible-scrollbar">
                                            {days.map((day, i) => (
                                                <div key={i} className="min-w-[40px] h-full border-r border-slate-200/50"></div>
                                            ))}
                                            {task.dueDate && <motion.div
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: 120, opacity: 1 }}
                                                className={`absolute h-6 rounded-lg border shadow-sm ${task.status === 'done' ? 'bg-teal-100 border-teal-200' :
                                                    task.status === 'doing' ? 'bg-blue-100 border-blue-200' :
                                                        'bg-slate-100 border-slate-200'
                                                    }`}
                                                style={{
                                                    left: `${Math.round((Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) - Date.UTC(days[0].getFullYear(), days[0].getMonth(), days[0].getDate())) / 86400000) * 40 + 10}px`
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
                                            </motion.div>}
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
