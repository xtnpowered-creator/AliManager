import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Calendar, Shield } from 'lucide-react';
import TimelineFilters from './TimelineFilters';
import { useAuth } from '../context/AuthContext';
import { useTimelineState } from '../hooks/useTimelineState';
import TimelineSkeleton from './TimelineSkeleton';
import TimelineControls from './TimelineControls';
import UnifiedTimelineBoard from './UnifiedTimelineBoard';

const TimelineView = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const highlightTaskId = searchParams.get('highlightTaskId');
    const { user } = useAuth();

    // -- State Hooks --
    const {
        tasks, refetchTasks, colleagues,
        filterText, setFilterText,
        visibleColleagues, filteredTasks,
        delegationMap, handleRevokeDelegation,
        handleUpdateTask, handleBulkUpdate, handleMoveDate, handleDeleteTasks,
        getTasksForColleague, setDelegations,
        loading
    } = useTimelineState(user);

    const [scale, setScale] = useState(10); // Days visible

    // Date Logic (Shared? UnifiedBoard calculates internal Days?)
    // UnifiedBoard uses days prop. We calculate it here or let it handle?
    // Let's calculate here to keep control.
    const days = React.useMemo(() => {
        const result = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 30);
        for (let i = 0; i < 90; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            result.push(d);
        }
        return result;
    }, []);

    const isToday = (d) => {
        const t = new Date(); t.setHours(0, 0, 0, 0);
        return d.getTime() === t.getTime();
    };

    // Listen for Today Event (Hack for button in header accessing ref in child)
    // Alternatively, pass a ref to UnifiedBoard? No, board has internal ref.
    // Pass a "triggerScrollToDate" prop?
    // UnifiedBoard exposes 'scrollToDate'. Ideally via Ref.
    // Let's skip the Button Logic for a second and just rely on the UnifiedBoard's internal overlay if prop is missing?
    // No, design requirement: Header has button.
    // Let's use a MutableRefObject passed DOWN.
    const controlsRef = React.useRef({});

    // Button above:
    const handleTodayClick = () => {
        if (controlsRef.current.scrollToDate) {
            controlsRef.current.scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)));
        }
    };

    // Update Header with click handler
    const headerWithClick = (
        <header className="flex items-center justify-between gap-8 relative">
            <div className="shrink-0">
                {user?.isDelegated && (
                    <div className="absolute -top-12 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 shadow-sm animate-in slide-in-from-top-2 fade-in">
                        <Shield size={14} className="text-amber-600" />
                        <span>You are acting as a Temporary Admin. Access expires on {new Date(user.delegationExpiresAt).toLocaleDateString()}.</span>
                    </div>
                )}
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Timelines</h2>
                <p className="text-slate-500 mt-1 text-lg">Manage assignments and schedules.</p>
            </div>
            <div className="flex-1 flex justify-center">
                <TimelineFilters filterText={filterText} setFilterText={setFilterText} />
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <TimelineControls
                    onTodayClick={handleTodayClick}
                    scale={scale}
                />
            </div>
        </header>
    );

    // Initial Load Only - Show Skeleton if we have no data yet
    // if (loading && (!tasks || tasks.length === 0)) return <TimelineSkeleton />;


    return (
        <div className="p-8 h-full flex flex-col space-y-8 overflow-hidden select-none">
            {headerWithClick}

            <UnifiedTimelineBoard
                user={user}
                colleagues={visibleColleagues}
                tasks={tasks}
                getTasksForColleague={getTasksForColleague}

                days={days}
                isToday={isToday}
                isWeekend={(d) => [0, 6].includes(d.getDay())}
                scale={scale}
                setScale={setScale}

                onUpdateTask={handleUpdateTask}
                onBulkUpdate={handleBulkUpdate}
                onDeleteTasks={handleDeleteTasks}
                onMoveDate={handleMoveDate}
                refetchTasks={refetchTasks}

                showSidebar={true}
                viewOffset={200}
                headerContent={null}

                // Expose controls
                controlsRef={controlsRef}

                // Delegation
                delegationMap={delegationMap}
                handleRevokeDelegation={handleRevokeDelegation}
                onDelegateConfig={setDelegations}
            />
        </div>
    );
};

export default TimelineView;