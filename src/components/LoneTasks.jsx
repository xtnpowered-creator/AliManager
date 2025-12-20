import React, { useState } from 'react';
import { useApiData } from '../hooks/useApiData';
import { ListTodo, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import NewTaskModal from './NewTaskModal';
import Card from './common/Card';

const LoneTasks = ({ pushView }) => {
    const { data: tasks, loading, refetch } = useApiData('/tasks');
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);

    // Filter tasks that are NOT assigned to any project
    const loneTasks = tasks.filter(task => !task.projectId);

    if (loading) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Lone Tasks</h2>
                    <p className="text-slate-500 mt-1 text-lg">Single event tasks not tied to any project.</p>
                </div>
                <button
                    onClick={() => setShowNewTaskModal(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                >
                    <ListTodo size={18} />
                    + New Task
                </button>
            </header>

            {loneTasks.length === 0 ? (
                <Card variant="GHOST">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-slate-300">
                        <ListTodo size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">No Lone Tasks</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">Every single event task is either completed or attached to a project.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loneTasks.map((task) => (
                        <Card
                            key={task.id}
                            variant="MACRO"
                            onClick={() => pushView && pushView('task-detail', { taskId: task.id })}
                            className="p-6 group cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-2 rounded-xl ${task.priority === 'high' ? 'bg-amber-100 text-amber-600' :
                                    task.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'
                                    }`}>
                                    <AlertCircle size={20} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {task.status}
                                </span>
                            </div>

                            <div>
                                <h4 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight group-hover:text-teal-600 transition-colors">
                                    {task.title}
                                </h4>
                                <p className="text-slate-500 text-sm mt-2 line-clamp-2">
                                    {task.description || "No description provided for this lone task."}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-400">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex -space-x-2">
                                    {task.assignedTo?.map((id, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[8px] text-white font-black uppercase">
                                            {id.slice(0, 1)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <NewTaskModal
                isOpen={showNewTaskModal}
                onClose={() => setShowNewTaskModal(false)}
                onSuccess={refetch}
            />
        </div>
    );
};

export default LoneTasks;
