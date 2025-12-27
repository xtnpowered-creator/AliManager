import React, { useState } from 'react';
import { FileText, CheckSquare, Activity, Paperclip } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';

import TaskStepsList from './TaskStepsList';
import TaskDetailHeader from './task/TaskDetailHeader';
import TaskDetailSidebar from './task/TaskDetailSidebar';

/**
 * Task Detail - Full Page View
 * 
 * PURPOSE:
 * Complete task detail page with tabbed content, metadata sidebar, and navigation.
 * Used when navigating to /task/:id route (full-screen dedicated task view).
 * 
 * ARCHITECTURE - THREE-COLUMN LAYOUT:
 * 
 * 1. **Header** (Top, full-width):
 *    - TaskDetailHeader component
 *    - Back button, task ID, title, status badge
 *    - Fixed height, stays above scrollable content
 * 
 * 2. **Main Content** (Center, scrollable):
 *    - Tab navigation bar (Overview, Steps, Activity, Files)
 *    - Tab content area (changes based on activeTab)
 *    - Scrollable content with padding
 * 
 * 3. **Sidebar** (Right, fixed width):
 *    - TaskDetailSidebar component
 *    - Assignees, dates, priority, metadata
 *    - Fixed 320px width, scrollable
 * 
 * TAB SYSTEM (4 tabs):
 * 
 * **1. Overview** (default):
 *    - Task description (prose styling, whitespace preserved)
 *    - Empty state: "No description provided" italic placeholder
 * 
 * **2. Steps**:
 *    - TaskStepsList component
 *    - Checklist of subtasks with progress tracking
 *    - Inline editing, toggle completion
 * 
 * **3. Activity** (placeholder):
 *    - Future: Audit log of task changes
 *    - Shows who changed what and when
 *    - Empty state with icon + description
 * 
 * **4. Files** (placeholder):
 *    - Future: File upload/attachment system
 *    - Drag-and-drop area
 *    - Empty state with upload prompt
 * 
 * DATA FETCHING:
 * - Fetches all tasks, colleagues, projects (from API)
 * - Finds task by ID from tasks array
 * - Derives assignedColleagues by filtering colleagues array
 * - Finds project by projectId reference
 * - Resolves creator name (from colleagues or "Me" if owner)
 * 
 * LOADING STATES:
 * - Loading: "Loading task details..." placeholder
 * - Not Found: "Task not found." error message (red text)
 * - Both prevent further rendering until data ready
 * 
 * NAVIGATION:
 * - onBack callback: Typically navigate(-1) or navigate('/tasks')
 * - Used in header's back button
 * 
 * DESIGN RATIONALE:
 * - Full-page view: Maximum space for task details
 * - Tabbed content: Organizes different aspects of task
 * - Fixed sidebar: Always-visible metadata reference
 * - Prose styling: Description reads like documentation
 * - Placeholder tabs: Shows future roadmap, prevents surprise
 * 
 * @param {string} taskId - ID of task to display
 * @param {Function} onBack - Navigation callback for back button
 * 
 * @example
 * // Route: /task/:id
 * const { id } = useParams();
 * <TaskDetailView
 *   taskId={id}
 *   onBack={() => navigate('/tasks')}
 * />
 */
const TaskDetailView = ({ taskId, onBack }) => {
    const { data: tasks, isLoading } = useApiData('/tasks');
    const { data: colleagues } = useApiData('/colleagues');
    const { data: projects } = useApiData('/projects');

    const task = tasks.find(t => t.id === taskId);
    const assignedColleagues = colleagues.filter(c => task?.assignedTo?.includes(c.id));
    const project = task?.projectId ? projects.find(p => p.id === task.projectId) : null;

    const creator = colleagues.find(c => c.id === task?.createdBy);
    const creatorName = creator ? creator.name : (task?.isOwner ? 'Me' : 'Unknown');

    const [activeTab, setActiveTab] = useState('overview');

    if (isLoading) return <div className="p-8 text-slate-400">Loading task details...</div>;
    if (!task) return <div className="p-8 text-red-400">Task not found.</div>;

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
            <TaskDetailHeader task={task} onBack={onBack} />

            <div className="flex-1 overflow-hidden flex">
                {/* Center Content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="flex px-6 border-b border-slate-200 shrink-0">
                        <TabButton id="overview" icon={FileText} label="Overview" />
                        <TabButton id="steps" icon={CheckSquare} label="Steps" />
                        <TabButton id="activity" icon={Activity} label="Activity" />
                        <TabButton id="files" icon={Paperclip} label="Files" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {activeTab === 'overview' && (
                            <div className="max-w-3xl space-y-8">
                                <section>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
                                    <div className="prose prose-slate prose-sm max-w-none text-slate-600">
                                        {task.description ? <p className="whitespace-pre-wrap">{task.description}</p> : <p className="italic text-slate-400">No description provided.</p>}
                                    </div>
                                </section>
                            </div>
                        )}
                        {activeTab === 'steps' && (
                            <div className="py-2">
                                <TaskStepsList taskId={task.id} taskAssigneeId={task.assignedTo?.[0]} taskDueDate={task.dueDate} />
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

                <TaskDetailSidebar
                    task={task}
                    assignedColleagues={assignedColleagues}
                    project={project}
                    creatorName={creatorName}
                />
            </div>
        </div>
    );
};

export default TaskDetailView;
