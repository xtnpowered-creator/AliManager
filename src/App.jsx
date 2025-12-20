import React, { useEffect, useState } from 'react';
import Shell from './components/Shell';
import Dashboard from './components/Dashboard';
import TimelineView from './components/TimelineView';
import KanbanBoard from './components/KanbanBoard';
import GanttChart from './components/GanttChart';
import ProjectList from './components/ProjectList';
import LoneTasks from './components/LoneTasks';
import Directory from './components/Directory';
import AdminDashboard from './components/AdminDashboard';
import TaskDetailView from './components/TaskDetailView';
import { seedDatabase } from './utils/seedData';
import { updateColleagueDetails } from './utils/updateColleagues';
import { removeDuplicateColleagues } from './utils/removeDuplicateColleagues';

function App() {
    // Navigation Stack: [{ id: 'dashboard', params: {} }]
    const [viewStack, setViewStack] = useState([{ id: 'dashboard', params: {} }]);

    const activeView = viewStack[viewStack.length - 1];

    // Navigation Helpers
    const pushView = (id, params = {}) => {
        console.log(`Pushing View: ${id}`, params);
        setViewStack(prev => [...prev, { id, params }]);
    };

    const popView = () => {
        console.log("Popping View");
        setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    };

    const resetView = (id, params = {}) => {
        console.log(`Resetting View Root: ${id}`);
        setViewStack([{ id, params }]);
    };

    // Deep Link Handling
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const taskId = params.get('taskId');
        if (taskId) {
            console.log("Deep Link Detected: Task ID", taskId);
            // Deep link logic: Reset to Timelines, then PUSH Task Detail? 
            // Or just reset directly to Task Detail?
            // Let's reset to Task Detail so back button goes nowhere? 
            // Better: Reset to Timelines, then Push Task Detail so user has context.
            setViewStack([
                { id: 'timelines', params: { highlightTaskId: taskId } },
                { id: 'task-detail', params: { taskId } }
            ]);

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Database Maintenance (keep commented out unless needed)
    /*
    useEffect(() => {
        seedDatabase().then(() => {
            updateColleagueDetails().then(() => {
                setTimeout(() => {
                    removeDuplicateColleagues();
                }, 2000);
            });
        });
    }, []);
    */

    return (
        <Shell currentView={activeView.id} setView={resetView}>
            {activeView.id === 'dashboard' && <Dashboard />}
            {activeView.id === 'timelines' && <TimelineView highlightTaskId={activeView.params?.highlightTaskId} pushView={pushView} />}
            {activeView.id === 'kanban' && <KanbanBoard />}
            {activeView.id === 'gantt' && <GanttChart />}
            {activeView.id === 'projects' && <ProjectList />}
            {activeView.id === 'lone-tasks' && <LoneTasks pushView={pushView} />}
            {activeView.id === 'team' && <Directory />}
            {activeView.id === 'admin' && <AdminDashboard />}

            {/* New Stacked Views */}
            {activeView.id === 'task-detail' && (
                <TaskDetailView
                    taskId={activeView.params?.taskId}
                    onBack={popView}
                />
            )}
        </Shell>
    );
}

export default App;
