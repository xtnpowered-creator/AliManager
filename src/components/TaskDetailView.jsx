import React, { useState } from 'react';
import { ChevronLeft, CheckSquare, Clock, FileText, Paperclip, Activity, Calendar, User, Tag, Plus } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';

import TaskStepsList from './TaskStepsList';

const TaskDetailView = ({ taskId, onBack }) => {
    // Fetch Task Data
    // We fetch ALL tasks for now to find the one, efficiently uses existing cache. 
    // Optimization: create /tasks/:id endpoint later if needed.
    const { data: tasks, isLoading } = useApiData('/tasks');
    const { data: colleagues } = useApiData('/colleagues');

    // Derived State
    const task = tasks.find(t => t.id === taskId);
    const assignedColleagues = colleagues.filter(c => task?.assignedTo?.includes(c.id));

    // UI State
    const [activeTab, setActiveTab] = useState('overview');

    if (isLoading) return <div className="p-8 text-slate-400">Loading task details...</div>;
    if (!task) return <div className="p-8 text-red-400">Task found found.</div>;

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium text-sm ${activeTab === id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 shadow-sm z-10">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
                    title="Go Back"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-0.5">
                        <span className="uppercase tracking-wider font-bold">TASK-{task.id.substring(0, 4)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Created {new Date(task.created_at || Date.now()).toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 truncate">{task.title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {task.status?.replace('_', ' ') || 'To Do'}
                    </span>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 overflow-hidden flex">

                {/* Center Content (Tabs) */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Tab Navigation */}
                    <div className="flex px-6 border-b border-slate-200 shrink-0">
                        <TabButton id="overview" icon={FileText} label="Overview" />
                        <TabButton id="steps" icon={CheckSquare} label="Steps" />
                        <TabButton id="activity" icon={Activity} label="Activity" />
                        <TabButton id="files" icon={Paperclip} label="Files" />
                    </div>

                    {/* Tab Content Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {activeTab === 'overview' && (
                            <div className="max-w-3xl space-y-8">
                                <section>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
                                    <div className="prose prose-slate prose-sm max-w-none text-slate-600">
                                        {task.description ? (
                                            <p className="whitespace-pre-wrap">{task.description}</p>
                                        ) : (
                                            <p className="italic text-slate-400">No description provided.</p>
                                        )}
                                    </div>
                                </section>

                                {/* Quick Stats / Metatdata that doesn't fit in sidebar?? Or just keep simple. */}
                            </div>
                        )}

                        {activeTab === 'steps' && (
                            <div className="py-2">
                                <TaskStepsList
                                    taskId={task.id}
                                    taskAssigneeId={task.assignedTo?.[0]}
                                    taskDueDate={task.dueDate}
                                />
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="max-w-2xl bg-slate-50 rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                                <Activity size={48} className="text-slate-300 mb-4" />
                                <h3 className="text-slate-900 font-bold mb-2">Audit Log</h3>
                                <p className="text-slate-500 text-sm">Track changes and updates to this task.</p>
                            </div>
                        )}

                        {activeTab === 'files' && (
                            <div className="max-w-2xl bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center hover:bg-slate-100/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <Paperclip size={24} className="text-teal-600" />
                                </div>
                                <h3 className="text-slate-900 font-bold mb-1">Drag files here</h3>
                                <p className="text-slate-500 text-xs">or click to browse</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar (Properties) */}
                <div className="w-80 border-l border-slate-200 bg-slate-50 overflow-y-auto p-6 space-y-8 shrink-0">

                    {/* Assignees */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignees</h3>
                            <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {assignedColleagues.length > 0 ? assignedColleagues.map(c => (
                                <div key={c.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                                        {c.avatar}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 truncate">{c.name}</span>
                                </div>
                            )) : (
                                <div className="text-sm text-slate-400 italic">No one assigned</div>
                            )}
                        </div>
                    </section>

                    {/* Dates */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Dates</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Due Date</p>
                                    <p className="font-medium text-slate-700">
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                    </p>
                                </div>
                            </div>
                            {/* Duration? Start Date? */}
                            <div className="flex items-center gap-3 text-sm">
                                <Clock size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Duration</p>
                                    <p className="font-medium text-slate-700">{task.duration || 1} Days</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Priority */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Priority</h3>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide
                            ${task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-green-50 text-green-700 border-green-200'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' :
                                task.priority === 'medium' ? 'bg-amber-500' :
                                    'bg-green-500'}`}
                            />
                            {task.priority || 'Medium'}
                        </div>
                    </section>

                    {/* Tags */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</h3>
                            <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {/* Mock Tags for now */}
                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 flex items-center gap-1">
                                <Tag size={10} /> Design
                            </span>
                            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 flex items-center gap-1">
                                <Tag size={10} /> Frontend
                            </span>
                        </div>
                    </section>

                    {/* Metadata */}
                    <section className="pt-6 border-t border-slate-200">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Project</span>
                                <span className="font-medium text-slate-600 truncate max-w-[150px]">AliManager 2.0</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Created by</span>
                                <span className="font-medium text-slate-600">Christian Plyler</span>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default TaskDetailView;
