import React from 'react';
import { ChevronLeft, Clock } from 'lucide-react';

/**
 * Task Detail Page Header
 * 
 * PURPOSE:
 * Top navigation bar for task detail page showing task metadata and back navigation.
 * Provides context and quick status overview while viewing task details.
 * 
 * LAYOUT:
 * - Left: Back button (< chevron)
 * - Center: Task ID + creation date + title (truncated if long)
 * - Right: Status badge (color-coded by status)
 * 
 * TASK ID FORMAT:
 * Shows first 4 characters of UUID for human-friendly reference.
 * Example: "TASK-A3F2" instead of full "a3f2e4d8-..."
 * 
 * STATUS COLORS:
 * - Done: Green (emerald-50/700)
 * - Doing: Blue (blue-50/700)
 * - Todo/Other: Gray (slate-100/600)
 * 
 * DESIGN:
 * - Fixed height: 64px (h-16)
 * - Shadow + border: Elevation effect, separates from content
 * - Truncate title: Prevents overflow on long task names
 * - z-10: Stays above scrollable content
 * 
 * @param {Object} task - Task object with: id, title, status, created_at/createdAt
 * @param {Function} onBack - Navigation callback (typically router.back() or navigate('/'))
 * 
 * @example
 * <TaskDetailHeader
 *   task={task}
 *   onBack={() => navigate('/tasks')}
 * />
 */
const TaskDetailHeader = ({ task, onBack }) => {
    return (
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
                        Created {new Date(task.created_at || task.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                </div>
                <h1 className="text-lg font-bold text-slate-900 truncate">{task.title}</h1>
            </div>
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    task.status === 'doing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                    {task.status?.toUpperCase() || 'TODO'}
                </span>
            </div>
        </div>
    );
};

export default TaskDetailHeader;
