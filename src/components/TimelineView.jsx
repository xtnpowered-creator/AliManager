import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
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
import MoveDateModal from './MoveDateModal';

// Helper to safely parse any date-like input into a Date object
const safeDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
};

const TimelineView = ({ highlightTaskId, pushView }) => {
    const { data: tasks = [], refetch: refetchTasks } = useApiData('/tasks');
    const { data: colleagues = [] } = useApiData('/colleagues');
    const { data: projectsData = [] } = useApiData('/projects');
    const { user } = useAuth();

    // -- Performance Refs --
    const scrollContainerRef = useRef(null);
    const taskRectsRef = useRef([]); // Cached positions { id, left, top, right, bottom }
    const rafIdRef = useRef(null);
    const shiftPressedRef = useRef(false);

    // -- State --
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [orderedColleagues, setOrderedColleagues] = useState([]);

    // View State
    const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);
    const [scrollTopState, setScrollTopState] = useState(0);
    const [expandedLocation, setExpandedLocation] = useState(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
    const [selectionRect, setSelectionRect] = useState(null);
    const [scale, setScale] = useState(10);

    // Modal State
    const [contextMenu, setContextMenu] = useState(null);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [newTaskDefaults, setNewTaskDefaults] = useState({});
    const [showGoToDate, setShowGoToDate] = useState(false);
    const [showCustomScale, setShowCustomScale] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [showMoveDateModal, setShowMoveDateModal] = useState(false);
    const [flagDate, setFlagDate] = useState(null);

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
            apiClient.get('/delegations').then(setDelegations).catch(err => console.error('Failed to fetch delegations:', err));
        }
    }, [user]);

    const handleRevokeDelegation = async (delegationId) => {
        if (confirm('Are you sure you want to revoke admin access?')) {
            try {
                await apiClient.delete(`/delegations/${delegationId}`);
                const res = await apiClient.get('/delegations');
                setDelegations(res);
            } catch (err) {
                console.error('Revoke failed:', err);
                alert('Failed to revoke.');
            }
        }
    };

    const delegationMap = useMemo(() => new Map(delegations.map(d => [d.delegate_id, d])), [delegations]);

    // Single Click: Toggle Inline Expansion OR Multi-Select (with Ctrl/Cmd)
    const handleTaskClick = useCallback((task, e) => {
        if (e && (e.ctrlKey || e.metaKey)) {
            // MULTI-SELECT TOGGLE
            setSelectedTaskIds(prev => {
                const next = new Set(prev);
                if (next.has(task.id)) {
                    next.delete(task.id);
                } else {
                    next.add(task.id);
                }
                return next;
            });
        } else {
            // NORMAL SELECTION & EXPANSION
            setExpandedTaskId(prev => (prev === task.id ? null : task.id));
            setSelectedTaskIds(new Set([task.id]));
        }
    }, []);

    // Double Click: Navigate to Full Details Page
    const handleTaskDoubleClick = useCallback((task) => {
        if (pushView) pushView('task-detail', { taskId: task.id });
    }, [pushView]);

    // Deep Link Scroll & Auto-Expand
    useEffect(() => {
        if (highlightTaskId && tasks.length > 0) {
            setExpandedTaskId(highlightTaskId);
            const targetTask = tasks.find(t => t.id === highlightTaskId);
            if (targetTask && targetTask.dueDate) {
                const date = safeDate(targetTask.dueDate);
                if (date) scrollToDate(date, true);
            }
        }
    }, [highlightTaskId, tasks]);

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
            if (!seenIds.has(c.id)) newOrder.push(c);
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

    const handleContextMenu = (e, type, data) => {
        e.preventDefault();
        if (type === 'task' && !selectedTaskIds.has(data.id)) {
            setSelectedTaskIds(new Set([data.id]));
        }
        setContextMenu({ x: e.clientX, y: e.clientY, type, data });
    };

    const handleBulkUpdate = async (updates) => {
        try {
            const promises = Array.from(selectedTaskIds).map(taskId => apiClient.patch(`/tasks/${taskId}`, updates));
            await Promise.all(promises);
            refetchTasks();
            setSelectedTaskIds(new Set());
        } catch (err) {
            console.error('Bulk update failed:', err);
            alert('Some updates failed');
        }
    };

    // Global Key Handlers (Escape and Shift Tracking)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') {
                shiftPressedRef.current = true;
                if (scrollContainerRef.current) scrollContainerRef.current.classList.add('cursor-crosshair');
            }

            if (e.key === 'Escape') {
                setContextMenu(null); setExpandedLocation(null); setShowNewTaskModal(false);
                setReassignTask(null); setRescheduleTask(null); setInviteTask(null);
                setShowMoveDateModal(false); setShowGoToDate(false); setShowCustomScale(false); setShowFlagModal(false);
                setExpandedTaskId(null); setSelectedTaskIds(new Set());
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Shift') {
                shiftPressedRef.current = false;
                if (scrollContainerRef.current) scrollContainerRef.current.classList.remove('cursor-crosshair');
            }
        };

        const handleBlur = () => {
            shiftPressedRef.current = false;
            if (scrollContainerRef.current) scrollContainerRef.current.classList.remove('cursor-crosshair');
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    const handleUpdateTask = useCallback(async (taskId, updates) => {
        try {
            await apiClient.patch(`/tasks/${taskId}`, updates);
            refetchTasks();
        } catch (err) {
            console.error('Failed to update task:', err);
            alert('Failed to update task');
        }
    }, [refetchTasks]);

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

    const getColumnWidth = useCallback((date) => {
        const containerW = scrollContainerRef.current?.clientWidth || window.innerWidth;
        const availableW = containerW - 200;
        const avgWidth = availableW / scale;
        const baseUnit = avgWidth * (7 / 6);
        return Math.max([0, 6].includes(date.getDay()) ? baseUnit * 0.5 : baseUnit, 20);
    }, [scale]);

    const isWeekend = (date) => [0, 6].includes(date.getDay());
    const isToday = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
    };

    // Filters & Visibility
    const filteredTasks = useMemo(() => {
        if (!filterText) return tasks;
        const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        const projectMap = new Map((projectsData || []).map(p => [p.id, p.title?.toLowerCase() || '']));
        const colleagueMap = new Map((colleagues || []).map(c => [c.id, c.name?.toLowerCase() || '']));
        return tasks.filter(t => tokens.every(token => {
            return t.title?.toLowerCase().includes(token) || (t.projectId && projectMap.get(t.projectId)?.includes(token)) || t.priority?.toLowerCase().includes(token) || t.assignedTo?.some(uid => colleagueMap.get(uid)?.includes(token));
        }));
    }, [tasks, filterText, projectsData, colleagues]);

    const visibleColleagues = useMemo(() => {
        let list = orderedColleagues;
        if (filterText) {
            const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            const activeIds = new Set();
            filteredTasks.forEach(t => t.assignedTo?.forEach(uid => activeIds.add(uid)));
            list = orderedColleagues.filter(c => activeIds.has(c.id) || tokens.every(token => c.name?.toLowerCase().includes(token)));
        }
        if (user) {
            const selfId = user.id || user.uid;
            const self = list.find(c => c.id === selfId) || (colleagues || []).find(c => c.id === selfId) || { id: selfId, name: user.displayName || 'Me', avatar: 'M' };
            return [self, ...list.filter(c => c.id !== selfId)];
        }
        return list;
    }, [orderedColleagues, filteredTasks, filterText, user, colleagues]);

    const getTasksForColleague = useCallback((colleagueId) => filteredTasks.filter(t => t.assignedTo?.includes(colleagueId)), [filteredTasks]);

    const scrollToDate = (date, smooth = true) => {
        if (!scrollContainerRef.current) return;
        let offset = 0;
        for (const day of days) {
            if (day.getTime() === date.getTime()) break;
            offset += getColumnWidth(day);
        }
        scrollContainerRef.current.scrollTo({ left: offset - 260, behavior: smooth ? 'smooth' : 'auto' });
    };

    const handleScaleChange = (newScale) => {
        if (scrollContainerRef.current) {
            const scrollLeft = scrollContainerRef.current.scrollLeft;
            const anchor = scrollLeft + 260;
            let current = 0;
            let centerDate = days[0];
            for (const day of days) {
                const width = getColumnWidth(day);
                if (anchor >= current && anchor < current + width) { centerDate = day; break; }
                current += width;
            }
            preserveDateRef.current = centerDate;
        }
        setScale(newScale);
    };

    const preserveDateRef = useRef(null);
    React.useLayoutEffect(() => {
        if (preserveDateRef.current) { scrollToDate(preserveDateRef.current, false); preserveDateRef.current = null; }
        else { scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)), false); }
    }, [scale]);

    // -- Performance Optimized Selection --
    // THROW DOWN THOSE UPDATES FAST
    const updateMarqueeThrottled = (rect) => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
            setSelectionRect(rect);
        });
    };

    const handleMouseDown = (e) => {
        if (e.target.closest('.no-pan')) return;
        const scrollBox = scrollContainerRef.current;
        const rect = scrollBox.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollBox.scrollLeft;
        const y = e.clientY - rect.top + scrollBox.scrollTop;

        if (e.shiftKey) {
            // CACHE Task Rects once on selection start
            const scrollBoxRect = scrollBox.getBoundingClientRect();
            const taskElements = scrollBox.querySelectorAll('.task-card');
            taskRectsRef.current = Array.from(taskElements).map(el => {
                const elRect = el.getBoundingClientRect();
                return {
                    id: el.getAttribute('data-task-id'),
                    top: elRect.top - scrollBoxRect.top + scrollBox.scrollTop,
                    left: elRect.left - scrollBoxRect.left + scrollBox.scrollLeft,
                    bottom: elRect.bottom - scrollBoxRect.top + scrollBox.scrollTop,
                    right: elRect.right - scrollBoxRect.left + scrollBox.scrollLeft
                };
            });

            setSelectionRect({ x1: x, y1: y, x2: x, y2: y });
            setSelectedTaskIds(new Set());
        } else {
            if (e.target.closest('.task-card')) return;
            setIsDraggingTimeline(true);
            setStartX(e.pageX - scrollBox.offsetLeft);
            setStartY(e.pageY - scrollBox.offsetTop);
            setScrollLeftState(scrollBox.scrollLeft);
            setScrollTopState(scrollBox.scrollTop);
            scrollBox.classList.add('cursor-grabbing');
            setSelectedTaskIds(new Set());
        }
    };

    const handleMouseMove = (e) => {
        const scrollBox = scrollContainerRef.current;
        if (!scrollBox) return;

        if (selectionRect) {
            const rect = scrollBox.getBoundingClientRect();
            const x = e.clientX - rect.left + scrollBox.scrollLeft;
            const y = e.clientY - rect.top + scrollBox.scrollTop;
            // DEFERRED: Only update the marquee rectangle, not the selection state
            updateMarqueeThrottled({ ...selectionRect, x2: x, y2: y });
        } else if (isDraggingTimeline) {
            scrollBox.scrollLeft = scrollLeftState - (e.pageX - scrollBox.offsetLeft - startX);
            scrollBox.scrollTop = scrollTopState - (e.pageY - scrollBox.offsetTop - startY);
        }
    };

    const handleMouseUp = () => {
        if (selectionRect) {
            // DEFERRED: Process final selection now
            const marqueeTop = Math.min(selectionRect.y1, selectionRect.y2);
            const marqueeLeft = Math.min(selectionRect.x1, selectionRect.x2);
            const marqueeRight = Math.max(selectionRect.x1, selectionRect.x2);
            const marqueeBottom = Math.max(selectionRect.y1, selectionRect.y2);

            const newSelected = new Set();
            for (const tRect of taskRectsRef.current) {
                const overlap = !(tRect.left > marqueeRight || tRect.right < marqueeLeft || tRect.top > marqueeBottom || tRect.bottom < marqueeTop);
                if (overlap) newSelected.add(tRect.id);
            }
            setSelectedTaskIds(newSelected);
        }

        setIsDraggingTimeline(false);
        setSelectionRect(null);
        if (scrollContainerRef.current) scrollContainerRef.current.classList.remove('cursor-grabbing');
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };

    const isAnySelectedTaskDone = useMemo(() => Array.from(selectedTaskIds).some(id => tasks.find(item => item.id === id)?.status === 'done'), [selectedTaskIds, tasks]);

    return (
        <div className="p-8 h-full flex flex-col space-y-6 overflow-hidden select-none">
            <header className="flex items-center justify-between gap-8 relative">
                <div className="shrink-0">
                    {user?.isDelegated && (
                        <div className="absolute -top-12 left-0 right-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 shadow-sm animate-in slide-in-from-top-2 fade-in">
                            <Shield size={14} className="text-amber-600" />
                            <span>You are acting as a Temporary Admin. Access expires on {new Date(user.delegationExpiresAt).toLocaleDateString()}.</span>
                        </div>
                    )}
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Timeline Directory</h2>
                    <p className="text-slate-500 mt-1 text-lg">Manage assignments and schedules.</p>
                </div>
                <div className="flex-1 flex justify-center">
                    <TimelineFilters filterText={filterText} setFilterText={setFilterText} />
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={() => scrollToDate(new Date(new Date().setHours(0, 0, 0, 0)), true)} className="flex items-center gap-2 px-6 py-3 bg-teal-100 border border-teal-200 rounded-2xl text-sm font-black text-teal-900 hover:bg-teal-200 transition-all shadow-sm group">
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
                    {selectionRect && (
                        <div style={{
                            position: 'absolute',
                            left: Math.min(selectionRect.x1, selectionRect.x2),
                            top: Math.min(selectionRect.y1, selectionRect.y2),
                            width: Math.abs(selectionRect.x2 - selectionRect.x1),
                            height: Math.abs(selectionRect.y2 - selectionRect.y1),
                            backgroundColor: 'rgba(20, 184, 166, 0.1)',
                            border: '1px solid rgb(20, 184, 166)',
                            zIndex: 10000,
                            pointerEvents: 'none',
                            borderRadius: '4px'
                        }} />
                    )}
                    <div className="flex sticky top-0 z-[200] bg-white/80 backdrop-blur-md border-b border-slate-200 min-w-max h-[73px]">
                        <div className="sticky left-0 z-[205] p-6 bg-slate-50/95 border-r border-slate-300 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center shrink-0" style={{ width: '200px' }}>Colleagues</div>
                        <div className="flex">
                            {days.map((day, i) => (
                                <div key={i}
                                    style={{ width: getColumnWidth(day), minWidth: getColumnWidth(day) }}
                                    onContextMenu={(e) => handleContextMenu(e, 'header', { date: day })}
                                    className={`flex flex-col items-center justify-center py-1 border-r border-slate-300 last:border-0 relative shrink-0 ${isToday(day) ? 'bg-teal-100/70' : isWeekend(day) ? 'bg-slate-200/70' : ''}`}
                                >
                                    {day.getDate() === 1 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500 z-50 pointer-events-none" />}
                                    {day.getDay() === 1 && <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/60 z-40 pointer-events-none" />}
                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className={`text-base font-black mt-0.5 mb-0.5 ${isToday(day) ? 'text-teal-950' : 'text-slate-900'}`}>{day.getDate()}</p>
                                    <p className={`text-[9px] font-black uppercase tracking-tight leading-none ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { month: 'short' })}</p>
                                    <p className={`text-[9px] font-black text-slate-500 uppercase tracking-tight leading-none mt-0.5 ${day.getFullYear() === new Date().getFullYear() ? 'invisible' : ''}`}>'{day.getFullYear().toString().slice(-2)}</p>
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
                                    onGridContextMenu={(date, collId, e) => handleContextMenu(e, 'grid', { date, colleagueId: collId })}
                                    safeDate={safeDate}
                                    scale={scale}
                                    expandedDay={expandedLocation?.colleagueId === colleague.id ? expandedLocation.dayKey : null}
                                    onExpandDay={(dayKey) => setExpandedLocation(dayKey ? { colleagueId: colleague.id, dayKey } : null)}
                                    expandedTaskId={expandedTaskId}
                                    selectedTaskIds={selectedTaskIds}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}
                    items={contextMenu.type === 'task' ? [
                        { label: 'View Details', icon: Eye, onClick: () => { if (pushView) pushView('task-detail', { taskId: contextMenu.data.id }); setContextMenu(null); } },
                        { type: 'separator' },
                        { label: `Change Due Date...${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: CalendarDays, disabled: isAnySelectedTaskDone, onClick: () => { setRescheduleTask(contextMenu.data); setContextMenu(null); } },
                        { label: `Move Due Date X days...${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Clock, disabled: isAnySelectedTaskDone, onClick: () => { setShowMoveDateModal(true); setContextMenu(null); } },
                        { label: `Reassign...${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: User, disabled: isAnySelectedTaskDone, onClick: () => { setReassignTask(contextMenu.data); setContextMenu(null); } },
                        { label: `Add Collab Assignment...${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: UserPlus, onClick: () => { setInviteTask(contextMenu.data); setContextMenu(null); } },
                        { type: 'separator' },
                        ...((contextMenu.data.isOwner || user?.role === 'god') ? [{
                            label: `Set Priority${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Zap,
                            submenu: [
                                { label: '1 - NOW!', icon: () => <div className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">1</div>, onClick: () => { handleBulkUpdate({ priority: '1' }); setContextMenu(null); } },
                                { label: '2 - ASAP', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">2</div>, onClick: () => { handleBulkUpdate({ priority: '2' }); setContextMenu(null); } },
                                { label: '3 - Soon', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">3</div>, onClick: () => { handleBulkUpdate({ priority: '3' }); setContextMenu(null); } },
                                { label: '4 - Later', icon: () => <div className="w-4 h-4 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black flex items-center justify-center">4</div>, onClick: () => { handleBulkUpdate({ priority: '4' }); setContextMenu(null); } },
                                { label: 'None', icon: Ban, onClick: () => { handleBulkUpdate({ priority: null }); setContextMenu(null); } }
                            ]
                        }] : []),
                        { type: 'separator' },
                        { label: `Mark Doing${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Play, onClick: () => { handleBulkUpdate({ status: 'doing' }); setContextMenu(null); } },
                        { label: `Mark Paused${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Pause, onClick: () => { handleBulkUpdate({ status: 'paused' }); setContextMenu(null); } },
                        { label: `Mark Done${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: CheckCircle2, onClick: () => { handleBulkUpdate({ status: 'done' }); setContextMenu(null); } },
                        { label: `Mark Pending${selectedTaskIds.size > 1 ? ` (${selectedTaskIds.size})` : ''}`, icon: Square, onClick: () => { handleBulkUpdate({ status: 'todo' }); setContextMenu(null); } },
                        { label: `Delete Task${selectedTaskIds.size > 1 ? `s (${selectedTaskIds.size})` : ''}`, icon: Trash2, danger: true, onClick: () => { if (confirm(selectedTaskIds.size > 1 ? `Delete these ${selectedTaskIds.size} tasks?` : 'Delete this task?')) { Promise.all(Array.from(selectedTaskIds).map(id => apiClient.delete(`/tasks/${id}`))).then(() => { refetchTasks(); setSelectedTaskIds(new Set()); }); } setContextMenu(null); } }
                    ] : contextMenu.type === 'header' ? [
                        { label: 'Go to date...', icon: Calendar, onClick: () => { setShowGoToDate(true); setContextMenu(null); } },
                        { label: 'Set Custom Scale...', icon: Maximize2, onClick: () => { setShowCustomScale(true); setContextMenu(null); } },
                        ...(scale !== 10 ? [{ label: 'Return to default scale', icon: RotateCcw, onClick: () => { handleScaleChange(10); setContextMenu(null); } }] : []),
                        { label: 'Set Custom Flag...', icon: Flag, onClick: () => { setFlagDate(contextMenu.data.date); setShowFlagModal(true); setContextMenu(null); } }
                    ] : contextMenu.type === 'colleague' ? [
                        ...(contextMenu.data.id === (user?.id || user?.uid) ? [] : [
                            ...((user?.role === 'admin' || user?.role === 'god') ? [
                                ...(delegationMap.has(contextMenu.data.id) ? [{ label: 'Revoke Admin Access', icon: Ban, danger: true, onClick: () => { handleRevokeDelegation(delegationMap.get(contextMenu.data.id).id); setContextMenu(null); } }] : [{ label: 'Delegate Admin Access...', icon: Shield, onClick: () => { setDelegationUser(contextMenu.data); setContextMenu(null); } }]),
                                { type: 'separator' }
                            ] : []),
                            { label: 'View Profile', icon: Eye, onClick: () => { if (pushView) pushView('user-profile', { userId: contextMenu.data.id }); setContextMenu(null); } }
                        ])
                    ] : [
                        { label: 'Create Task Here...', icon: Plus, onClick: () => { setNewTaskDefaults({ dueDate: contextMenu.data.date, assigneeId: contextMenu.data.colleagueId }); setShowNewTaskModal(true); setContextMenu(null); } }
                    ]}
                />
            )}

            <ReassignModal isOpen={!!reassignTask} onClose={() => setReassignTask(null)} onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }} taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : reassignTask?.id} taskTitle={reassignTask?.title} currentAssigneeId={reassignTask?.assignedTo?.[0]} />
            <RescheduleModal isOpen={!!rescheduleTask} onClose={() => setRescheduleTask(null)} onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }} taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : rescheduleTask?.id} taskTitle={rescheduleTask?.title} currentDate={rescheduleTask?.dueDate} />
            <InviteModal isOpen={!!inviteTask} onClose={() => { setInviteTask(null); setSelectedTaskIds(new Set()); }} taskId={selectedTaskIds.size > 1 ? Array.from(selectedTaskIds) : inviteTask?.id} taskTitle={inviteTask?.title} />
            <MoveDateModal isOpen={showMoveDateModal} onClose={() => setShowMoveDateModal(false)} onSuccess={() => { refetchTasks(); setSelectedTaskIds(new Set()); }} tasks={tasks} selectedTaskIds={selectedTaskIds} />
            <NewTaskModal isOpen={showNewTaskModal} onClose={() => setShowNewTaskModal(false)} onSuccess={refetchTasks} initialData={newTaskDefaults} />
            <GoToDateModal isOpen={showGoToDate} onClose={() => setShowGoToDate(false)} onGo={(date) => scrollToDate(date)} />
            <CustomScaleModal isOpen={showCustomScale} onClose={() => setShowCustomScale(false)} onApply={handleScaleChange} />
            <FlagModal isOpen={showFlagModal} onClose={() => setShowFlagModal(false)} initialDate={flagDate} />
            <DelegationModal isOpen={!!delegationUser} colleague={delegationUser} onClose={() => setDelegationUser(null)} onSuccess={() => apiClient.get('/delegations').then(setDelegations)} />
        </div>
    );
};

export default TimelineView;