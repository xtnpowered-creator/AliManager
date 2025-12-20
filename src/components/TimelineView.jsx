import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApiData } from '../hooks/useApiData';
import { apiClient } from '../api/client';
import { Clock, Calendar, GripVertical, User, UserPlus, CalendarDays, Eye, CheckCircle2, RotateCw, RotateCcw, Trash2, Plus, Play, Pause, Square, Maximize2, Flag, Zap, Ban, Shield } from 'lucide-react';
import AssignmentConflictModal from './AssignmentConflictModal';
import { addScrollTestData } from '../utils/addTestData';
import TimelineRow from './TimelineRow';
import TimelineFilters from './TimelineFilters';
import { getTaskCardColor } from '../utils/cardStyles';
import TaskDetailModal from './TaskDetailModal';
import ContextMenu from './ContextMenu';
import NewTaskModal from './NewTaskModal';
import TaskCard from './TaskCard';
import ReassignModal from './ReassignModal';
import RescheduleModal from './RescheduleModal';
import InviteModal from './InviteModal';
import { GoToDateModal, CustomScaleModal, FlagModal } from './HeaderModals';
import DelegationModal from './DelegationModal';
import { useAuth } from '../context/AuthContext';

// Helper to safely parse any date-like input into a Date object
const safeDate = (dateVal) => {
    if (!dateVal) return null;
    // Handle Firestore Timestamp (legacy, harmless to keep for a bit)
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    // Handle ISO string or Date object
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
};

const TimelineView = ({ highlightTaskId, pushView }) => {
    const { data: tasks, refetch: refetchTasks } = useApiData('/tasks');
    const { data: colleagues } = useApiData('/colleagues');
    const { data: projectsData } = useApiData('/projects');
    const { user } = useAuth();

    // -- NEW: Expanded Task State for Inline Details --
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    // Single Click: Toggle Inline Expansion
    const handleTaskClick = (task) => {
        setExpandedTaskId(prev => (prev === task.id ? null : task.id));
    };

    // Double Click: Navigate to Full Details Page
    const handleTaskDoubleClick = (task) => {
        if (pushView) {
            pushView('task-detail', { taskId: task.id });
        } else {
            console.warn("pushView not provided to TimelineView");
        }
    };

    // Deep Link Scroll & Auto-Expand
    useEffect(() => {
        if (highlightTaskId && tasks.length > 0) {
            setExpandedTaskId(highlightTaskId); // Auto-expand the highlighted task
            const targetTask = tasks.find(t => t.id === highlightTaskId);
            if (targetTask && targetTask.dueDate) {
                const date = safeDate(targetTask.dueDate);
                if (date) scrollToDate(date, true);
            }
        }
    }, [highlightTaskId, tasks]);

    // Filter State
    const [filterText, setFilterText] = useState('');

    // Order state
    const [orderedColleagues, setOrderedColleagues] = useState([]);

    // Sync colleagues with local storage order
    useEffect(() => {
        if (colleagues.length === 0) return;
        const savedOrder = JSON.parse(localStorage.getItem('colleagueOrder') || '[]');
        const colleagueMap = new Map(colleagues.map(c => [c.id, c]));
        const newOrder = [];
        const seenIds = new Set();
        savedOrder.forEach(id => {
            if (colleagueMap.has(id)) {
                newOrder.push(colleagueMap.get(id));
                seenIds.add(id);
            }
        });
        colleagues.forEach(c => {
            if (!seenIds.has(c.id)) {
                newOrder.push(c);
            }
        });
        if (savedOrder.length === 0) {
            const alisaraIndex = newOrder.findIndex(c => c.name === 'Alisara Plyler');
            if (alisaraIndex > 0) {
                const [alisara] = newOrder.splice(alisaraIndex, 1);
                newOrder.unshift(alisara);
            }
        }
        setOrderedColleagues(newOrder);
    }, [colleagues]);

    // View State
    const scrollContainerRef = useRef(null);
    const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);
    const [scrollTopState, setScrollTopState] = useState(0);
    const [expandedLocation, setExpandedLocation] = useState(null); // { colleagueId, dayKey }

    // Modal State
    const [contextMenu, setContextMenu] = useState(null);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [newTaskDefaults, setNewTaskDefaults] = useState({});

    const [showGoToDate, setShowGoToDate] = useState(false);
    const [showCustomScale, setShowCustomScale] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [flagDate, setFlagDate] = useState(null);
    // scale is number of visible days. Default 10.
    const [scale, setScale] = useState(10);

    // Action Modals State
    const [reassignTask, setReassignTask] = useState(null);
    const [rescheduleTask, setRescheduleTask] = useState(null);
    const [inviteTask, setInviteTask] = useState(null);

    // Delegation State
    const [delegations, setDelegations] = useState([]);
    const [delegationUser, setDelegationUser] = useState(null);

    // Fetch Delegations if Admin
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'god')) {
            apiClient.get('/delegations')
                .then(setDelegations)
                .catch(err => console.error('Failed to fetch delegations:', err));
        }
    }, [user]);

    const handleRevokeDelegation = async (delegationId) => {
        if (confirm('Are you sure you want to revoke admin access?')) {
            try {
                await apiClient.delete(`/delegations/${delegationId}`);
                // Refresh list
                const res = await apiClient.get('/delegations');
                setDelegations(res);
            } catch (err) {
                console.error('Revoke failed:', err);
                alert('Failed to revoke.');
            }
        }
    };

    const delegationMap = React.useMemo(() => {
        return new Map(delegations.map(d => [d.delegate_id, d]));
    }, [delegations]);

    const handleContextMenu = (e, type, data) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type,
            data
        });
    };

    const handleCloseContextMenu = () => setContextMenu(null);

    // Global Escape Handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setContextMenu(null);
                setExpandedLocation(null);
                setShowNewTaskModal(false);
                setReassignTask(null);
                setRescheduleTask(null);
                setInviteTask(null);
                // Also close expanded task
                setExpandedTaskId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleGridContextMenu = (date, colleagueId, e) => {
        handleContextMenu(e, 'grid', { date, colleagueId });
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            await apiClient.patch(`/tasks/${taskId}`, updates);
            refetchTasks();
        } catch (err) {
            console.error("Failed to update task:", err);
            alert("Failed to update task");
        }
    };

    // Calculate Days
    const days = useMemo(() => {
        const result = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 90);
        for (let i = 0; i < 180; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            result.push(date);
        }
        return result;
    }, []);

    const getColumnWidth = (date) => {
        // Always use weighted logic based on 'scale' (days count)
        const containerW = scrollContainerRef.current?.clientWidth || window.innerWidth;
        const availableW = containerW - 200;

        const avgWidth = availableW / scale;
        const baseUnit = avgWidth * (7 / 6);

        return Math.max(isWeekend(date) ? baseUnit * 0.5 : baseUnit, 20);
    };

    const isWeekend = (date) => [0, 6].includes(date.getDay());
    const isToday = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
    };

    // Filters
    const filteredTasks = useMemo(() => {
        if (!filterText) return tasks;
        const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        const projectMap = new Map(projectsData?.map(p => [p.id, p.title?.toLowerCase() || '']) || []);
        const colleagueMap = new Map(colleagues?.map(c => [c.id, c.name?.toLowerCase() || '']) || []);

        return tasks.filter(t => {
            return tokens.every(token => {
                const matchesTask = t.title?.toLowerCase().includes(token);
                const matchesProject = t.projectId && projectMap.get(t.projectId)?.includes(token);
                const matchesPriority = t.priority?.toLowerCase().includes(token);
                const matchesColleague = t.assignedTo?.some(uid => colleagueMap.get(uid)?.includes(token));
                return matchesTask || matchesProject || matchesPriority || matchesColleague;
            });
        });
    }, [tasks, filterText, projectsData, colleagues]);

    console.log('TimelineView Render:', {
        tasks: tasks?.length,
        colleagues: colleagues?.length,
        projects: projectsData?.length,
        filtered: filteredTasks?.length
    });

    const visibleColleagues = useMemo(() => {
        let list = orderedColleagues;

        // Filter Logic
        if (filterText) {
            const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            const activeVisibleIds = new Set();
            filteredTasks.forEach(t => {
                t.assignedTo?.forEach(uid => activeVisibleIds.add(uid));
            });
            const matchesByName = orderedColleagues.filter(c => {
                const name = c.name?.toLowerCase() || '';
                return tokens.every(token => name.includes(token));
            });
            const unionIds = new Set([
                ...matchesByName.map(c => c.id),
                ...[...activeVisibleIds]
            ]);
            list = orderedColleagues.filter(c => unionIds.has(c.id));
        }

        // Self-Row Logic: Ensure Current User is ALWAYS First
        if (user) {
            const selfId = user.id || user.uid;
            const selfInList = list.find(c => c.id === selfId);
            const otherColleagues = list.filter(c => c.id !== selfId);

            let selfColleague = selfInList;
            if (!selfColleague) {
                // If checking against ALL colleagues (not just filtered/ordered) to find self
                const selfInAll = colleagues.find(c => c.id === selfId);
                selfColleague = selfInAll || {
                    id: selfId,
                    name: user.displayName || user.email || 'Me',
                    avatar: (user.displayName || user.email || 'M').charAt(0).toUpperCase(),
                    role: user.role || 'member',
                    company: '',
                    department: '',
                    position: ''
                };
            }

            return [selfColleague, ...otherColleagues];
        }

        return list;
    }, [orderedColleagues, filteredTasks, filterText, user, colleagues]);

    const isFiltering = !!filterText;

    const getTasksForColleague = (colleagueId) => {
        return filteredTasks.filter(t => t.assignedTo?.includes(colleagueId));
    };

    // Scroll Logic
    const getOffsetForDate = (targetDate) => {
        const targetTime = targetDate.getTime();
        let offset = 0;
        for (const day of days) {
            if (day.getTime() === targetTime) break;
            offset += getColumnWidth(day);
        }
        return offset;
    };

    const getDateAtOffset = (scrollLeft) => {
        const anchorOffset = scrollLeft + 260;
        let currentOffset = 0;
        for (const day of days) {
            const width = getColumnWidth(day);
            if (anchorOffset >= currentOffset && anchorOffset < currentOffset + width) {
                return day;
            }
            currentOffset += width;
        }
        return days[Math.floor(days.length / 2)];
    };

    const scrollToDate = (date, smooth = true) => {
        if (!scrollContainerRef.current) return;
        const offset = getOffsetForDate(date);
        const targetScrollLeft = offset - 260;
        scrollContainerRef.current.scrollTo({
            left: targetScrollLeft,
            behavior: smooth ? 'smooth' : 'auto'
        });
    };

    const handleToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scrollToDate(today, true);
    };

    const preserveDateRef = useRef(null);

    const handleScaleChange = (newScale) => {
        if (scrollContainerRef.current) {
            const centerDate = getDateAtOffset(scrollContainerRef.current.scrollLeft);
            preserveDateRef.current = centerDate;
        }
        setScale(newScale);
    };

    // Layout Effect for Scroll
    React.useLayoutEffect(() => {
        if (preserveDateRef.current) {
            scrollToDate(preserveDateRef.current, false);
            preserveDateRef.current = null;
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            scrollToDate(today, false);
        }
    }, [scale]);

    // Timeline Pan
    const handleMouseDown = (e) => {
        if (e.target.closest('.no-pan') || e.target.closest('.task-card')) return;
        setIsDraggingTimeline(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setStartY(e.pageY - scrollContainerRef.current.offsetTop);
        setScrollLeftState(scrollContainerRef.current.scrollLeft);
        setScrollTopState(scrollContainerRef.current.scrollTop);
        scrollContainerRef.current.classList.add('cursor-grabbing');
    };

    const handleMouseMove = (e) => {
        if (!isDraggingTimeline) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const y = e.pageY - scrollContainerRef.current.offsetTop;
        const walkX = (x - startX);
        const walkY = (y - startY);
        scrollContainerRef.current.scrollLeft = scrollLeftState - walkX;
        scrollContainerRef.current.scrollTop = scrollTopState - walkY;
    };

    const handleMouseUp = () => {
        setIsDraggingTimeline(false);
        scrollContainerRef.current?.classList.remove('cursor-grabbing');
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6 overflow-hidden select-none">
            <header className="flex items-center justify-between gap-8 relative">
                <div className="shrink-0">
                    {user?.isDelegated && (
                        <div className="absolute -top-12 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 shadow-sm animate-in slide-in-from-top-2 fade-in">
                            <Shield size={14} className="text-amber-600" />
                            <span>
                                You are acting as a Temporary Admin. Access expires on {new Date(user.delegationExpiresAt).toLocaleDateString()}.
                            </span>
                        </div>
                    )}
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Timeline Directory</h2>
                    <p className="text-slate-500 mt-1 text-lg">Manage assignments and schedules.</p>
                </div>

                <div className="flex-1 flex justify-center">
                    <TimelineFilters
                        filterText={filterText}
                        setFilterText={setFilterText}
                    />
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {/* Standard Scale buttons removed. Default is 7 days. Use Context Menu for custom. */}

                    <button onClick={handleToday} className="flex items-center gap-2 px-6 py-3 bg-teal-100 border border-teal-200 rounded-2xl text-sm font-black text-teal-900 hover:bg-teal-200 transition-all shadow-sm group">
                        <Calendar size={18} className="text-teal-600 group-hover:scale-110 transition-transform" />
                        TODAY
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="flex-1 overflow-auto invisible-scrollbar relative cursor-grab active:cursor-grabbing"
                >
                    <div className="flex sticky top-0 z-[200] bg-white/80 backdrop-blur-md border-b border-slate-200 min-w-max h-[73px]">
                        <div className="sticky left-0 z-[205] p-6 bg-slate-50/95 border-r border-slate-300 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center shrink-0" style={{ width: '200px' }}>
                            Colleagues
                        </div>
                        <div className="flex">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    style={{ width: getColumnWidth(day), minWidth: getColumnWidth(day) }}
                                    onContextMenu={(e) => handleContextMenu(e, 'header', { date: day })}
                                    className={`flex flex-col items-center justify-center py-1 border-r border-slate-300 last:border-0 relative shrink-0 ${isToday(day) ? 'bg-teal-100/70' : isWeekend(day) ? 'bg-slate-200/70' : ''}`}
                                >
                                    {day.getDate() === 1 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500 z-50 pointer-events-none" />
                                    )}
                                    {day.getDay() === 1 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/60 z-40 pointer-events-none" />
                                    )}
                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <p className={`text-base font-black mt-0.5 mb-0.5 ${isToday(day) ? 'text-teal-950' : 'text-slate-900'}`}>
                                        {day.getDate()}
                                    </p>
                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>
                                        {day.toLocaleDateString('en-US', { month: 'short' })}
                                    </p>
                                    <p className={`text-[9px] font-black text-slate-500 uppercase tracking-tight leading-none mt-0.5 ${day.getFullYear() === new Date().getFullYear() ? 'invisible' : ''}`}>
                                        '{day.getFullYear().toString().slice(-2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col min-w-max">
                        {visibleColleagues.map((colleague, cIdx) => (
                            <div key={colleague.id} className={cIdx === 0 ? "sticky top-[73px] z-[150] shadow-xl border-y-2 border-slate-900 bg-white" : "border-b border-slate-200 last:border-0"}>
                                <TimelineRow
                                    colleague={colleague}
                                    colleagueIndex={cIdx}
                                    colleagues={visibleColleagues}
                                    days={days}
                                    getColumnWidth={getColumnWidth}
                                    isToday={isToday}
                                    isWeekend={isWeekend}
                                    getTasksForColleague={getTasksForColleague}
                                    onUpdate={handleUpdateTask}
                                    onTaskClick={handleTaskClick}
                                    onTaskDoubleClick={handleTaskDoubleClick}
                                    onTaskContextMenu={(e, task) => handleContextMenu(e, 'task', task)}
                                    onGridContextMenu={handleGridContextMenu}
                                    safeDate={safeDate}
                                    scale={scale}
                                    expandedDay={expandedLocation?.colleagueId === colleague.id ? expandedLocation.dayKey : null}
                                    onExpandDay={(dayKey) => setExpandedLocation(dayKey ? { colleagueId: colleague.id, dayKey } : null)}
                                    expandedTaskId={expandedTaskId}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseContextMenu}
                    items={contextMenu.type === 'task' ? [
                        {
                            label: 'View Details',
                            icon: Eye,
                            onClick: () => {
                                if (pushView) pushView('task-detail', { taskId: contextMenu.data.id });
                                setContextMenu(null);
                            }
                        },
                        { type: 'separator' },
                        {
                            label: 'Change Due Date',
                            icon: CalendarDays,
                            onClick: () => {
                                setRescheduleTask(contextMenu.data);
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Reassign to Other',
                            icon: User,
                            onClick: () => {
                                setReassignTask(contextMenu.data);
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Add Collab Assignment',
                            icon: UserPlus,
                            onClick: () => {
                                setInviteTask(contextMenu.data);
                                setContextMenu(null);
                            }
                        },
                        { type: 'separator' },
                        ...((contextMenu.data.isOwner || user?.role === 'god') ? [{
                            label: 'Set Priority',
                            icon: Zap,
                            submenu: [
                                { label: '1 - NOW!', icon: () => <div className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">1</div>, onClick: () => { handleUpdateTask(contextMenu.data.id, { priority: '1' }); setContextMenu(null); } },
                                { label: '2 - ASAP', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">2</div>, onClick: () => { handleUpdateTask(contextMenu.data.id, { priority: '2' }); setContextMenu(null); } },
                                { label: '3 - Soon', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">3</div>, onClick: () => { handleUpdateTask(contextMenu.data.id, { priority: '3' }); setContextMenu(null); } },
                                { label: '4 - Later', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">4</div>, onClick: () => { handleUpdateTask(contextMenu.data.id, { priority: '4' }); setContextMenu(null); } },
                                { label: 'None', icon: Ban, onClick: () => { handleUpdateTask(contextMenu.data.id, { priority: null }); setContextMenu(null); } }
                            ]
                        }] : []),
                        { type: 'separator' },
                        {
                            label: 'Mark Doing',
                            icon: Play,
                            onClick: () => {
                                handleUpdateTask(contextMenu.data.id, { status: 'doing' });
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Mark Paused',
                            icon: Pause,
                            onClick: () => {
                                handleUpdateTask(contextMenu.data.id, { status: 'paused' });
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Mark Done',
                            icon: CheckCircle2,
                            onClick: () => {
                                handleUpdateTask(contextMenu.data.id, { status: 'done' });
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Mark Pending',
                            icon: Square,
                            onClick: () => {
                                handleUpdateTask(contextMenu.data.id, { status: 'todo' });
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Delete Task',
                            icon: Trash2,
                            danger: true,
                            onClick: () => {
                                if (confirm('Are you sure you want to delete this task?')) {
                                    apiClient.delete(`/tasks/${contextMenu.data.id}`).then(refetchTasks);
                                }
                                setContextMenu(null);
                            }
                        }
                    ] : contextMenu.type === 'header' ? [
                        {
                            label: 'Go to date...',
                            icon: Calendar,
                            onClick: () => {
                                setShowGoToDate(true);
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Set Custom Scale...',
                            icon: Maximize2,
                            onClick: () => {
                                setShowCustomScale(true);
                                setContextMenu(null);
                            }
                        },
                        ...(scale !== 10 ? [{
                            label: 'Return to default scale',
                            icon: RotateCcw,
                            onClick: () => {
                                handleScaleChange(10);
                                setContextMenu(null);
                            }
                        }] : []),
                        {
                            label: 'Set Custom Flag...',
                            icon: Flag,
                            onClick: () => {
                                setFlagDate(contextMenu.data.date);
                                setShowFlagModal(true);
                                setContextMenu(null);
                            }
                        }
                    ] : contextMenu.type === 'colleague' ? [
                        // Me?
                        ...(contextMenu.data.id === (user?.id || user?.uid) ? [] : [
                            // Admin check for Delegation
                            ...((user?.role === 'admin' || user?.role === 'god') ? [
                                ...(delegationMap.has(contextMenu.data.id) ? [{
                                    label: 'Revoke Admin Access',
                                    icon: Ban,
                                    danger: true,
                                    onClick: () => {
                                        const d = delegationMap.get(contextMenu.data.id);
                                        handleRevokeDelegation(d.id);
                                        setContextMenu(null);
                                    }
                                }] : [{
                                    label: 'Delegate Admin Access...',
                                    icon: Shield,
                                    onClick: () => {
                                        setDelegationUser(contextMenu.data);
                                        setContextMenu(null);
                                    }
                                }]),
                                { type: 'separator' }
                            ] : []),

                            {
                                label: 'View Profile',
                                icon: Eye,
                                onClick: () => {
                                    if (pushView) pushView('user-profile', { userId: contextMenu.data.id });
                                    setContextMenu(null);
                                }
                            }])
                    ] : [
                        {
                            label: 'Create Task Here',
                            icon: Plus,
                            onClick: () => {
                                setNewTaskDefaults({
                                    dueDate: contextMenu.data.date,
                                    assigneeId: contextMenu.data.colleagueId
                                });
                                setShowNewTaskModal(true);
                                setContextMenu(null);
                            }
                        }
                    ]}
                />
            )}

            <ReassignModal
                isOpen={!!reassignTask}
                onClose={() => setReassignTask(null)}
                onSuccess={refetchTasks}
                taskId={reassignTask?.id}
                taskTitle={reassignTask?.title}
                currentAssigneeId={reassignTask?.assignedTo?.[0]}
            />

            <RescheduleModal
                isOpen={!!rescheduleTask}
                onClose={() => setRescheduleTask(null)}
                onSuccess={refetchTasks}
                taskId={rescheduleTask?.id}
                taskTitle={rescheduleTask?.title}
                currentDate={rescheduleTask?.dueDate}
            />

            <InviteModal
                isOpen={!!inviteTask}
                onClose={() => setInviteTask(null)}
                taskId={inviteTask?.id}
                taskTitle={inviteTask?.title}
            />

            <NewTaskModal
                isOpen={showNewTaskModal}
                onClose={() => setShowNewTaskModal(false)}
                onSuccess={refetchTasks}
                initialData={newTaskDefaults}
            />

            <GoToDateModal
                isOpen={showGoToDate}
                onClose={() => setShowGoToDate(false)}
                onGo={(date) => scrollToDate(date)}
            />

            <CustomScaleModal
                isOpen={showCustomScale}
                onClose={() => setShowCustomScale(false)}
                onApply={(days) => {
                    handleScaleChange(days);
                }}
            />

            <FlagModal
                isOpen={showFlagModal}
                onClose={() => setShowFlagModal(false)}
                initialDate={flagDate}
            />

            <DelegationModal
                isOpen={!!delegationUser}
                colleague={delegationUser}
                onClose={() => setDelegationUser(null)}
                onSuccess={() => {
                    apiClient.get('/delegations').then(setDelegations);
                }}
            />
        </div>
    );
};

export default TimelineView;