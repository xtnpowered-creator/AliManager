import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * TaskCard (Dashboard Variant)
 * 
 * Simplified task card for dashboard column views.
 * Different from timeline TaskCard - this is list-style, not position-absolute.
 * 
 * Features:
 * - Priority 1 badge (red ring + "Priority 1" label)
 * - Status badge (done/doing/todo color-coded)
 * - Due date display (red if overdue)
 * - Assignee info (delegated tasks only)
 * - Hover effects (shadow + border color)
 * 
 * Visual Hierarchy:
 * - Urgent tasks: Larger title, red ring, priority badge
 * - Normal tasks: Standard card sizing
 * - Delegated tasks: Shows assignee bar at bottom
 * 
 * @param {Object} props
 * @param {Object} props.task - Task object
 * @param {Object} [props.assignee] - Colleague object (for delegated tasks)
 * @param {boolean} [props.isDelegated=false] - Show assignee info
 */
const TaskCard = ({ task, assignee, isDelegated }) => {
    const isUrgent = task.priority === '1';

    return (
        <div className={`group relative p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all ${isUrgent ? 'ring-1 ring-red-500/20 bg-red-50/5' : ''}`}>
            {isUrgent && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm z-10">
                    Priority 1
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${task.status === 'done' ? 'bg-teal-100 text-teal-700' :
                    task.status === 'doing' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-500'
                    }`}>
                    {task.status?.toUpperCase().replace('_', ' ')}
                </span>
                {task.dueDate && (
                    <span className={`text-xs font-semibold ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-slate-400'
                        }`}>
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>

            <h4 className={`font-bold text-slate-900 mb-1 line-clamp-2 ${isUrgent ? 'text-lg' : 'text-base'}`}>
                {task.title}
            </h4>

            {isDelegated && assignee && (
                <div className="mt-4 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                        {assignee.avatar}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 font-medium">Assigned to <span className="text-slate-900 font-bold">{assignee.name.split(' ')[0]}</span></p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300" />
                </div>
            )}
        </div>
    );
};

/**
 * UsersIconPlaceholder Component
 * SVG icon for empty delegate column state
 */
const UsersIconPlaceholder = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

/**
 * TaskColumn Component
 * 
 * Scrollable task list column for MyDashboard.
 * Shows either "My Priorities" or "Delegated Tasks" with adaptive styling.
 * 
 * Features:
 * - Count badge (colored background)
 * - Loading state (skeleton cards)
 * - Empty state (icon + message)
 * - Scrollable list with custom scrollbar
 * - Delegated mode (shows assignee info on cards)
 * 
 * Layout:
 * - Header: Title + count badge + optional extra content
 * - Body: Scrollable task list (flex-1 overflow-y-auto)
 * 
 * Visual Variants:
 * - My Priorities: Teal badge
 * - Delegated Tasks: Indigo badge + "TRACKING" label
 * 
 * @param {Object} props
 * @param {string} props.title - Column title
 * @param {number} props.count - Task count for badge
 * @param {Array} props.tasks - Task list
 * @param {boolean} props.loading - Show skeleton loader
 * @param {string} props.emptyMessage - Empty state text
 * @param {Array} [props.colleagues] - Colleague list (for assignee lookup)
 * @param {boolean} [props.isDelegated=false] - Show assignee info on cards
 * @param {string} [props.headerColorClass] - Badge color classes
 * @param {ReactNode} [props.headerExtra] - Extra header content
 */
const TaskColumn = ({
    title,
    count,
    tasks,
    loading,
    emptyMessage,
    colleagues,
    isDelegated = false,
    headerColorClass = "bg-slate-100 text-slate-700",
    headerExtra
}) => {
    return (
        <div className="flex flex-col gap-6 h-full overflow-hidden">
            {/* Header: Title + Count Badge */}
            <div className="flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg ${headerColorClass} flex items-center justify-center text-sm font-bold`}>
                        {count}
                    </span>
                    {title}
                </h3>
                {headerExtra}
            </div>

            {/* Body: Scrollable Task List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {loading ? (
                    // Loading State: Skeleton Cards
                    [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse"></div>)
                ) : tasks.length === 0 ? (
                    // Empty State: Icon + Message
                    <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
                        {isDelegated ? <UsersIconPlaceholder /> : <CheckCircle2 size={32} className="text-slate-300" />}
                        <p>{emptyMessage}</p>
                    </div>
                ) : (
                    // Task List: Map to TaskCards
                    tasks.map(task => {
                        let assignee = null;
                        if (isDelegated && colleagues) {
                            const assigneeId = task.assignedTo?.[0];
                            assignee = colleagues.find(c => c.id === assigneeId);
                        }
                        return (
                            <TaskCard
                                key={task.id}
                                task={task}
                                assignee={assignee}
                                isDelegated={isDelegated}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TaskColumn;
