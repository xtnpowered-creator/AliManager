import React from 'react';
import { Plus, Calendar } from 'lucide-react';

/**
 * Task Detail Metadata Sidebar
 * 
 * PURPOSE:
 * Right sidebar displaying task metadata: assignees, dates, priority, and references.
 * Provides quick access to key task properties without cluttering main content area.
 * 
 * SECTIONS (top to bottom):
 * 
 * 1. **Assignees**:
 *    - Shows all assigned colleagues with avatars + names
 *    - "+ Add" button (placeholder, not yet wired)
 *    - Empty state: "No one assigned"
 * 
 * 2. **Dates**:
 *    - Due Date with calendar icon
 *    - Displays formatted date or "No date"
 * 
 * 3. **Priority**:
 *    - Color-coded badge with dot indicator
 *    - Priority 1 (Urgent): Red
 *    - Priority 2 (ASAP): Amber/Yellow
 *    - Priority 3 (Soon): Darker Amber
 *    - Priority 4+ (Later): Green
 * 
 * 4. **Metadata** (below border):
 *    - Project: Associated project title or "No Project"
 *    - Created by: Creator's name
 * 
 * PRIORITY COLOR SYSTEM:
 * - **P1 (Urgent)**: Red badge (bg-red-50, text-red-700, red dot)
 *   - Use case: Immediate blockers, critical bugs
 * 
 * - **P2 (ASAP)**: Amber badge (bg-amber-50, text-amber-700, amber dot)
 *   - Use case: Important features, near-term deadlines
 * 
 * - **P3 (Soon)**: Darker Amber (bg-amber-50, text-amber-900, amber dot)
 *   - Use case: Planned work, medium priority
 * 
 * - **P4+ (Later)**: Green badge (bg-green-50, text-green-700, green dot)
 *   - Use case: Backlog, nice-to-haves
 * 
 * LAYOUT:
 * - Fixed width: 320px (w-80)
 * - Left border: Separates from main content
 * - Light gray background (bg-slate-50)
 * - Scrollable content (overflow-y-auto)
 * - 8-unit spacing between sections (space-y-8)
 * 
 * FUTURE ENHANCEMENTS (Placeholders):
 * - Assignees "+ Add": Should open AddUserModal or reassignment
 * - Dates: Click to open RescheduleModal
 * - Priority: Click to change priority level
 * - All currently static display only
 * 
 * @param {Object} task - Task object with: dueDate, priority
 * @param {Array<Object>} assignedColleagues - Colleagues assigned to task (id, name, avatar)
 * @param {Object} project - Associated project (title)
 * @param {string} creatorName - Name of user who created the task
 * 
 * @example
 * <TaskDetailSidebar
 *   task={task}
 *   assignedColleagues={colleagues.filter(c => task.assignedTo.includes(c.id))}
 *   project={projects.find(p => p.id === task.projectId)}
 *   creatorName={users.find(u => u.id === task.createdBy)?.name}
 * />
 */
const TaskDetailSidebar = ({ task, assignedColleagues, project, creatorName }) => {
    return (
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
                </div>
            </section>

            {/* Priority */}
            <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Priority</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide
                    ${task.priority === '1' ? 'bg-red-50 text-red-700 border-red-200' :
                        task.priority === '2' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            task.priority === '3' ? 'bg-amber-50 text-amber-900 border-amber-100' :
                                'bg-green-50 text-green-700 border-green-200'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${task.priority === '1' ? 'bg-red-500' :
                        task.priority === '2' ? 'bg-amber-500' :
                            task.priority === '3' ? 'bg-amber-600' :
                                'bg-green-500'}`}
                    />
                    {task.priority === '1' ? 'Urgent' : task.priority === '2' ? 'ASAP' : task.priority === '3' ? 'Soon' : 'Later'}
                </div>
            </section>

            {/* Metadata */}
            <section className="pt-6 border-t border-slate-200">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Project</span>
                        <span className="font-medium text-slate-600 truncate max-w-[150px]">
                            {project ? project.title : 'No Project'}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Created by</span>
                        <span className="font-medium text-slate-600">{creatorName}</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TaskDetailSidebar;
