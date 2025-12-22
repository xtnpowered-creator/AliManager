import React, { useMemo } from 'react';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Card from './common/Card';

const MyDashboard = () => {
    const { user } = useAuth();
    const { data: tasks, loading: tasksLoading } = useApiData('/tasks');
    const { data: colleagues } = useApiData('/colleagues');

    const { myTasks, delegatedTasks, myCompleted } = useMemo(() => {
        if (!user || !tasks) return { myTasks: [], delegatedTasks: [], myCompleted: [] };

        const userId = user.uid || user.id;

        const myPending = [];
        const delegated = [];
        const completed = [];

        tasks.forEach(task => {
            const isAssignedToMe = task.assignedTo?.includes(userId);
            const isCreatedByMe = task.createdBy === userId;
            const isUnassigned = (!task.assignedTo || task.assignedTo.length === 0);

            // Logic: 
            // 1. Assigned to Me -> My Task
            // 2. Created by Me AND Unassigned -> My Task (Self-Note)
            // 3. Created by Me AND Assigned to Someone Else -> Delegated Task

            if (task.status === 'done') {
                if (isAssignedToMe || (isCreatedByMe && isUnassigned)) {
                    completed.push(task);
                }
                return;
            }

            if (isAssignedToMe || (isCreatedByMe && isUnassigned)) {
                myPending.push(task);
            } else if (isCreatedByMe && !isAssignedToMe && !isUnassigned) {
                delegated.push(task);
            }
        });

        // Sorting: Priority '1' (Now) is Top, then Due Date Asc
        const sortFn = (a, b) => {
            if (a.priority === '1' && b.priority !== '1') return -1;
            if (a.priority !== '1' && b.priority === '1') return 1;
            // Both are same priority class (1 or not-1), sort by due date
            const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000); // Far future if no date
            const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
            return dateA - dateB;
        };

        return {
            myTasks: myPending.sort(sortFn),
            delegatedTasks: delegated.sort(sortFn),
            myCompleted: completed
        };
    }, [tasks, user]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-16 h-full flex flex-col">
            <header>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">My Dashboard</h2>
                <p className="text-slate-500 mt-1 text-lg">Your priorities and team delegations.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                {/* My Priorities Column */}
                <div className="flex flex-col gap-6 h-full overflow-hidden">
                    <div className="flex items-center justify-between shrink-0">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">
                                {myTasks.length}
                            </span>
                            My Priorities
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {tasksLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse"></div>)
                        ) : myTasks.length === 0 ? (
                            <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
                                <CheckCircle2 size={32} className="text-slate-300" />
                                <p>No pending tasks</p>
                            </div>
                        ) : (
                            myTasks.map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        )}
                    </div>
                </div>

                {/* Delegated Tasks Column */}
                <div className="flex flex-col gap-6 h-full overflow-hidden">
                    <div className="flex items-center justify-between shrink-0">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                                {delegatedTasks.length}
                            </span>
                            Delegated Tasks
                        </h3>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {tasksLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse"></div>)
                        ) : delegatedTasks.length === 0 ? (
                            <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
                                <UsersIconPlaceholder />
                                <p>No active delegations</p>
                            </div>
                        ) : (
                            delegatedTasks.map(task => {
                                const assigneeId = task.assignedTo?.[0];
                                const assignee = colleagues.find(c => c.id === assigneeId);
                                return (
                                    <TaskCard key={task.id} task={task} assignee={assignee} isDelegated />
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reusable Task Card for this View
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
                    {task.status}
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

            {/* Delegated View: Show who is doing it */}
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

const UsersIconPlaceholder = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

export default MyDashboard;
