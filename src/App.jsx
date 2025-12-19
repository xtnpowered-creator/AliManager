import React, { useEffect, useState } from 'react';
import Shell from './components/Shell';
import Dashboard from './components/Dashboard';
import TimelineView from './components/TimelineView';
import KanbanBoard from './components/KanbanBoard';
import GanttChart from './components/GanttChart';
import ProjectList from './components/ProjectList';
import LoneTasks from './components/LoneTasks';
import Directory from './components/Directory';
import { seedDatabase } from './utils/seedData';
import { updateColleagueDetails } from './utils/updateColleagues';
import { removeDuplicateColleagues } from './utils/removeDuplicateColleagues';
import AdminDashboard from './components/AdminDashboard';

function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [highlightTaskId, setHighlightTaskId] = useState(null);

    // Deep Link Handling
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const taskId = params.get('taskId');
        if (taskId) {
            console.log("Deep Link Detected: Task ID", taskId);
            setHighlightTaskId(taskId);
            setCurrentView('timelines');

            // Optional: Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Uncomment below to seed/update/cleanup database (run once, then comment out again)
    useEffect(() => {
        seedDatabase().then(() => {
            // Update existing colleagues with new fields
            updateColleagueDetails().then(() => {
                // Wait a bit for all operations to complete, then remove duplicates
                setTimeout(() => {
                    removeDuplicateColleagues();
                }, 2000);
            });
        });
    }, []);

    return (
        <Shell currentView={currentView} setView={setCurrentView}>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'timelines' && <TimelineView highlightTaskId={highlightTaskId} />}
            {currentView === 'kanban' && <KanbanBoard />}
            {currentView === 'gantt' && <GanttChart />}
            {currentView === 'projects' && <ProjectList />}
            {currentView === 'lone-tasks' && <LoneTasks />}
            {currentView === 'team' && <Directory />}
            {currentView === 'admin' && <AdminDashboard />}
        </Shell>
    );
}



export default App;



