import React from 'react';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import DashboardTimeline from '../components/dashboard/DashboardTimeline';
import TaskColumn from '../components/dashboard/TaskColumn';
import TimelineControls from '../components/TimelineControls';

const MyDashboard = () => {
    const { user } = useAuth();
    const { data: tasks, loading: tasksLoading, refetch: refetchTasks, setData: setTasks } = useApiData('/tasks');
    const { data: colleagues } = useApiData('/colleagues');

    // Timeline Controls State
    const [scale, setScale] = React.useState(25);
    const controlsRef = React.useRef({});

    const handleTodayClick = () => {
        if (controlsRef.current.scrollToDate) {
            controlsRef.current.scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)));
        }
    };

    // Guard: Redirect if no user (should be handled by ProtectedRoute but this is a fail-safe)
    if (!user) return <div className="p-8 text-center text-slate-400">Not Authenticated. Please refresh or login.</div>;

    const { myTasks, delegatedTasks, myCompleted } = React.useMemo(() => {
        if (!user || !tasks) return { myTasks: [], delegatedTasks: [], myCompleted: [] };

        const userId = user.uid || user.id;
        const myPending = [];
        const delegated = [];
        const completed = [];

        tasks.forEach(task => {
            const isAssignedToMe = task.assignedTo?.includes(userId);
            const isCreatedByMe = task.createdBy === userId;
            const isUnassigned = (!task.assignedTo || task.assignedTo.length === 0);

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
            const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
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
        <div className="p-8 space-y-8 pb-16 h-full flex flex-col">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">My Dashboard</h2>
                    <p className="text-slate-500 mt-1 text-lg">Your priorities and team delegations.</p>
                </div>
                <div className="flex items-center gap-4">
                    <TimelineControls
                        onTodayClick={handleTodayClick}
                        scale={scale}
                    />
                </div>
            </header>

            {/* Timeline View - Duplicated User Row */}
            <div className="shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200">
                <DashboardTimeline
                    initialTasks={myTasks}
                    setTasks={setTasks}
                    user={user}
                    refetchTasks={refetchTasks}
                    scale={scale}
                    setScale={setScale}
                    controlsRef={controlsRef}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                {/* My Priorities Column */}
                <TaskColumn
                    title="My Priorities"
                    count={myTasks.length}
                    tasks={myTasks}
                    loading={tasksLoading}
                    emptyMessage="No pending tasks"
                    headerColorClass="bg-teal-100 text-teal-700"
                />

                {/* Delegated Tasks Column */}
                <TaskColumn
                    title="Delegated Tasks"
                    count={delegatedTasks.length}
                    tasks={delegatedTasks}
                    loading={tasksLoading}
                    emptyMessage="No active delegations"
                    colleagues={colleagues}
                    isDelegated={true}
                    headerColorClass="bg-indigo-100 text-indigo-700"
                    headerExtra={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking</span>}
                />
            </div>
        </div>
    );
};

export default MyDashboard;
