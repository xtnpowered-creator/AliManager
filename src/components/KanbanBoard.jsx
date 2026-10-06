import React, { useState } from 'react';
import PageLayout from './layout/PageLayout';
import { motion } from 'framer-motion';
import { useApiData } from '../hooks/useApiData';
import { MoreHorizontal, Plus, Clock, Users } from 'lucide-react';
import { getTaskCardColor } from '../utils/cardStyles';
import NewTaskModal from './NewTaskModal';
import { useBoardFilters } from '../hooks/useBoardFilters';
import FilterAndSortToolbar from './shared/filters/FilterAndSortToolbar';

const KanbanBoard = () => {
    const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useApiData('/tasks');
    const { data: colleagues } = useApiData('/colleagues');
    const { data: projects } = useApiData('/projects');
    const filters = useBoardFilters(tasks, colleagues, projects);
    const cardRefs = React.useRef(new Map());
    const [highlightedId, setHighlightedId] = useState(null);
    const firstMatch = () => {
        const task = filters.visibleTasks[0];
        if (!task) return;
        setHighlightedId(task.id);
        cardRefs.current.get(task.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    };

    const [showNewTaskModal, setShowNewTaskModal] = useState(false);

    const columns = [
        { id: 'todo', title: 'To Do', color: 'bg-slate-100 text-slate-600' },
        { id: 'doing', title: 'In Progress', color: 'bg-blue-100 text-blue-700' },
        { id: 'done', title: 'Completed', color: 'bg-teal-100 text-teal-700' },
    ];

    const getTasksByStatus = (status) => filters.visibleTasks.filter(t => t.status === status);

    return (
        <PageLayout
            title="Kanban Board"
            subtitle="Manage task progression and bottlenecks."
            actions={
                <div className="flex gap-3">
                    <button onClick={() => filters.setTaskFilters([...filters.taskFilters.filter(f => f.type !== 'due date'), { type: 'due date', value: 'Today' }])} className="px-4 py-2 bg-teal-50 border border-teal-300 rounded-lg text-xs font-black text-teal-900">
                        DUE TODAY
                    </button>
                    <button onClick={firstMatch} disabled={!filters.hasFilters || !filters.visibleTasks.length} className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-black disabled:opacity-40">FIRST MATCH</button>
                    <button
                        onClick={() => setShowNewTaskModal(true)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Task
                    </button>
                </div>
            }
            filters={<FilterAndSortToolbar tasks={tasks} colleagues={colleagues} projectsData={projects} {...filters} showProjectControls showSortControls={false} />}
        >
            {/* Modal */}
            <NewTaskModal
                isOpen={showNewTaskModal}
                onClose={() => setShowNewTaskModal(false)}
                onSuccess={refetchTasks}
            />

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 invisible-scrollbar">
                {columns.filter(column => !filters.hideEmptyRows || getTasksByStatus(column.id).length).map(column => (
                    <div key={column.id} className="min-w-[350px] flex-1 flex flex-col bg-slate-50/50 rounded-3xl border border-slate-300/70 p-4">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">{column.title}</h3>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${column.color}`}>
                                    {getTasksByStatus(column.id).length}
                                </span>
                            </div>
                            <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-all">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {tasksLoading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-2xl w-full"></div>)}
                                </div>
                            ) : (
                                getTasksByStatus(column.id).map(task => (
                                    <div key={task.id} ref={element => element ? cardRefs.current.set(task.id, element) : cardRefs.current.delete(task.id)} className={highlightedId === task.id ? 'ring-4 ring-teal-500 rounded-2xl' : ''}>
                                        <KanbanCard task={task} colleagues={colleagues} />
                                    </div>
                                ))
                            )}

                            <button
                                onClick={() => setShowNewTaskModal(true)}
                                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 text-xs font-bold hover:border-slate-400 hover:text-slate-500 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} />
                                Add Task
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </PageLayout>
    );
};

const getTypeLabel = (t) => {
    if (t.type === 'project') return 'PROJ';
    if (t.projectId) return 'PTASK';
    return 'LTASK';
};

const getPriorityLabel = (p) => {
    if (!p) return 'TASK';
    const lowerP = p.toLowerCase();
    if (lowerP === 'high') return 'HIGH';
    if (lowerP === 'medium') return 'MED';
    if (lowerP === 'low') return 'LOW';
    return p.toUpperCase();
};

const KanbanCard = ({ task, colleagues }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
        className={`${getTaskCardColor(task)} p-5 rounded-2xl border border-slate-300 shadow-sm cursor-grab active:cursor-grabbing group`}
    >
        <div className="flex flex-col gap-0.5 mb-3 text-left">
            <span className="text-[7.5px] font-black text-slate-900/40 uppercase tracking-widest leading-none">
                {getTypeLabel(task)}
            </span>
            <span className="text-[8px] font-black uppercase tracking-wider leading-none text-slate-900">
                {getPriorityLabel(task.priority)}
            </span>
        </div>

        <h4 className="font-bold text-slate-800 text-sm mb-4 leading-tight">{task.title}</h4>

        <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 text-slate-400">
                <Clock size={12} />
                <span className="text-[10px] font-bold uppercase">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date'}
                </span>
            </div>

            <div className="flex -space-x-2">
                {task.assignedTo?.map(id => {
                    const colleague = colleagues.find(c => c.id === id);
                    return colleague ? (
                        <div key={id} className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white uppercase" title={colleague.name}>
                            {colleague.avatar}
                        </div>
                    ) : null;
                })}
            </div>
        </div>
    </motion.div>
);

export default KanbanBoard;
