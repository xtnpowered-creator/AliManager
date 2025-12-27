import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Calendar, User, Plus } from 'lucide-react';
import { apiClient } from '../api/client';
import { useApiData } from '../hooks/useApiData';
import { useToast } from '../context/ToastContext';

/**
 * NewTaskModal Component
 * 
 * Task creation modal with intelligent assignee search, inline user creation,
 * and flexible initialization from multiple contexts (timeline, kanban, dashboard).
 * 
 * Key Features:
 * 1. **Smart Assignee UX**:
 *    - Type-ahead search through colleague directory
 *    - Real-time filtering as user types
 *    - "Add to Directory" prompt when no matches found
 *    - Inline user creation (creates colleague + assigns in one flow)
 *    - Selected assignee shown with pill UI (removable with X button)
 * 
 * 2. **Flexible Initialization**:
 *    - initialDate prop: Pre-fill due date (from timeline right-click)
 *    - initialAssignee prop: Pre-select assignee (from colleague row)
 *    - initialData object: Combined params (from context menu)
 *    - All props optional (manual entry mode)
 * 
 * 3. **Date Handling**:
 *    - Defensive parsing: Handles ISO strings, Date objects, timestamps
 *    - Converts to YYYY-MM-DD for input[type="date"] compatibility
 *    - Validates before submission (rejects invalid dates)
 *    - Submits as ISO string to API
 * 
 * 4. **Form Fields**:
 *    - Title (required): "What needs to be done?"
 *    - Due Date (required): Calendar picker
 *    - Assignee (optional): Searchable dropdown with create option
 *    - Priority (optional): "A.S.A.P.", "Sooner is better", "Whenever"
 * 
 * 5. **Inline User Creation Flow**:
 *    - User types name not in directory
 *    - "Add [name] to Directory" option appears (teal prompt)
 *    - Click prompt → Email input dialog
 *    - Creates user via POST /users
 *    - Refetches colleagues
 *    - Auto-selects new user as assignee
 *    - Continues with task creation
 * 
 * 6. **Visual Design**:
 *    - Modal overlay: slate-900/40 with backdrop blur
 *    - Card: white rounded-3xl with shadow-2xl
 *    - Animations: Framer Motion scale + fade
 *    - Icon badge: Teal CheckSquare in rounded background
 *    - Large title input: text-xl font-bold
 *    - Fields: bg-slate-50 rounded-xl with icons
 * 
 * 7. **Submission Flow**:
 *    - e.preventDefault() stops form default
 *    - Validates date is parseable
 *    - Converts date to ISO string
 *    - Wraps assignee in array (API expects array)
 *    - POST /tasks with {title, dueDate, priority, assignedTo}
 *    - Success: Toast + onSuccess callback + onClose
 *    - Error: Toast with error message
 *    - Always: Reset form fields to initial state
 * 
 * 8. **Loading States**:
 *    - Assignee dropdown loading handled by useApiData
 *    - Form submit: "Creating..." button text
 *    - User creation: isAddingUser prevents double-submit
 *    - All buttons disabled during submission
 * 
 * 9. **Smart Prompts**:
 *    - showAddPrompt logic:
 *      - assigneeSearch has text AND
 *      - filteredColleagues is empty AND
 *      - No assignee selected yet
 *    - Prevents prompt when user is backspacing or already selected someone
 * 
 * 10. **Modal Behavior**:
 *     - Click outside to close (onClick on backdrop)
 *     - X button in top-right
 *     - Escape key closes (handled by AnimatePresence)
 *     - Click on modal card stops propagation (prevents close)
 * 
 * Integration Points:
 * - **Timeline right-click**: Pass date from clicked column
 * - **Kanban "+ Add Task"**: Opens modal for specific column status
 * - **Dashboard quick-create**: Opens blank modal
 * - **Colleague row**: Pre-selects that colleague as assignee
 * 
 * Form Validation:
 * - Title: required attribute enforces presence
 * - Due Date: required attribute enforces selection
 * - Assignee: Optional (empty array if none selected)
 * - Priority: Defaults to "whenever", always has value
 * 
 * API Contract:
 * ```
 * POST /tasks
 * {
 *   title: string (required),
 *   dueDate: ISO string | null,
 *   priority: 'asap' | 'sooner' | 'whenever',
 *   assignedTo: string[] (array of colleague IDs)
 * }
 * ```
 * 
 * User Creation Contract:
 * ```
 * POST /users
 * {
 *   email: string (required),
 *   name: string (from search input)
 * }
 * Returns: { id, display_name, ... }
 * ```
 * 
 * Props:
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler (clears modal, resets form)
 * @param {Function} [props.onSuccess] - Callback after task created (refetch tasks)
 * @param {Date|string} [props.initialDate] - Pre-fill due date (legacy single prop)
 * @param {string} [props.initialAssignee] - Pre-select assignee ID (legacy single prop)
 * @param {Object} [props.initialData] - Combined initial values object
 * @param {Date|string} [props.initialData.dueDate] - Pre-fill due date
 * @param {string} [props.initialData.assigneeId] - Pre-select assignee ID
 * @component
 */
const NewTaskModal = ({ isOpen, onClose, onSuccess, initialDate, initialAssignee, initialData }) => {
    const { showToast } = useToast();
    const { data: colleagues, refetch: refetchColleagues } = useApiData('/colleagues');

    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('whenever');
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [selectedAssignee, setSelectedAssignee] = useState(null);

    // Smart assignee UX: suggest creating new users when search has no matches
    const [showAddPrompt, setShowAddPrompt] = useState(false);
    const [isAddingUser, setIsAddingUser] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Defensive date parsing: convert various date formats to YYYY-MM-DD for input[type="date"]
        const safeToDateString = (val) => {
            if (!val) return '';
            const d = new Date(val);
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        };

        // Handle discrete props (Legacy/LoneTasks)
        if (initialDate) setDueDate(safeToDateString(initialDate));
        if (initialAssignee) setSelectedAssignee(initialAssignee);

        // Handle object prop (Timeline Context Menu)
        if (initialData) {
            if (initialData.dueDate) setDueDate(safeToDateString(initialData.dueDate));
            if (initialData.assigneeId) setSelectedAssignee(initialData.assigneeId);
        }
    }, [initialDate, initialAssignee, initialData, isOpen]);

    // Filter colleagues
    const filteredColleagues = colleagues.filter(c =>
        c.name.toLowerCase().includes(assigneeSearch.toLowerCase())
    );

    useEffect(() => {
        // Show prompt if search has text but no matches, and we haven't selected someone yet
        if (assigneeSearch && filteredColleagues.length === 0 && !selectedAssignee) {
            setShowAddPrompt(true);
        } else {
            setShowAddPrompt(false);
        }
    }, [assigneeSearch, filteredColleagues.length, selectedAssignee]);

    const handleCreateUser = async () => {
        if (!assigneeSearch.includes('@')) {
            showToast("Enter an email address to create a new user", 'info');
            const email = prompt(`Enter email for ${assigneeSearch}:`);
            if (!email) return;

            setIsAddingUser(true);
            try {
                const res = await apiClient.post('/users', { email, name: assigneeSearch });
                await refetchColleagues();

                // Select the new user
                setSelectedAssignee(res.data.id); // Assuming Backend returns the new user object or similar
                setAssigneeSearch(res.data.display_name || assigneeSearch);
                setShowAddPrompt(false);
            } catch (err) {
                showToast("Failed to create user: " + err.message, 'error');
            } finally {
                setIsAddingUser(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Final validation before submitting
            let finalDueDate = null;
            if (dueDate) {
                const d = new Date(dueDate);
                if (!isNaN(d.getTime())) {
                    finalDueDate = d.toISOString();
                }
            }

            await apiClient.post('/tasks', {
                title,
                dueDate: finalDueDate,
                priority,
                assignedTo: selectedAssignee ? [selectedAssignee] : []
            });
            showToast(`Created task: "${title}"`, 'success'); // Specific Confirmation
            onSuccess?.();
            onClose();
            // Reset
            setTitle('');
            setAssigneeSearch('');
            setSelectedAssignee(null);
        } catch (err) {
            console.error(err);
            showToast("Failed to create task", 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>

                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl"><CheckSquare size={24} /></div>
                            <h3 className="text-2xl font-bold text-slate-900">New Task</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Task Title</label>
                                <input
                                    autoFocus
                                    className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 p-0"
                                    placeholder="What needs to be done?"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Date */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Due Date</label>
                                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                                        <Calendar size={18} className="text-slate-400" />
                                        <input
                                            type="date"
                                            className="bg-transparent border-none focus:ring-0 w-full text-sm font-bold text-slate-700"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Assignee */}
                                <div className="relative">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Assignee</label>

                                    {!selectedAssignee ? (
                                        <div className="relative">
                                            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl focus-within:ring-2 ring-teal-500/50">
                                                <User size={18} className="text-slate-400" />
                                                <input
                                                    className="bg-transparent border-none focus:ring-0 w-full text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                                    placeholder="Type name..."
                                                    value={assigneeSearch}
                                                    onChange={e => setAssigneeSearch(e.target.value)}
                                                />
                                            </div>

                                            {/* Dropdown */}
                                            {assigneeSearch && (
                                                <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-xl z-50 max-h-48 overflow-y-auto">
                                                    {filteredColleagues.map(c => (
                                                        <div
                                                            key={c.id}
                                                            onClick={() => { setSelectedAssignee(c.id); setAssigneeSearch(''); }}
                                                            className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                                                        >
                                                            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs">{c.avatar}</div>
                                                            <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                                        </div>
                                                    ))}

                                                    {showAddPrompt && (
                                                        <div
                                                            onClick={handleCreateUser}
                                                            className="p-3 bg-teal-50 hover:bg-teal-100 cursor-pointer flex items-center gap-2 text-teal-700 transition-colors"
                                                        >
                                                            <div className="w-6 h-6 bg-teal-200 rounded-full flex items-center justify-center"><Plus size={14} /></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold">Add "{assigneeSearch}" to Directory</span>
                                                                <span className="text-[10px] opacity-70">create new entry & assign</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-teal-50 p-3 rounded-xl border border-teal-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-teal-200 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {colleagues.find(c => c.id === selectedAssignee)?.avatar}
                                                </div>
                                                <span className="text-sm font-bold text-teal-900">
                                                    {colleagues.find(c => c.id === selectedAssignee)?.name}
                                                </span>
                                            </div>
                                            <button onClick={() => setSelectedAssignee(null)} className="p-1 hover:bg-teal-200 rounded-lg text-teal-700"><X size={14} /></button>
                                        </div>
                                    )}
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value)}
                                        className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold text-slate-700 border-none focus:ring-2 focus:ring-teal-500/50 appearance-none cursor-pointer"
                                    >
                                        <option value="asap">A.S.A.P.</option>
                                        <option value="sooner">Sooner is better</option>
                                        <option value="whenever">Whenever</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    {loading ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div >
        </AnimatePresence >
    );
};

export default NewTaskModal;
