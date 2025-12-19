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

function App() {
    const [currentView, setCurrentView] = useState('dashboard');

    // Uncomment below to seed/update/cleanup database (run once, then comment out again)
    // useEffect(() => {
    //     if (import.meta.env.DEV) {
    //         seedDatabase().then(() => {
    //             // Update existing colleagues with new fields
    //             updateColleagueDetails().then(() => {
    //                 // Wait a bit for all operations to complete, then remove duplicates
    //                 setTimeout(() => {
    //                     removeDuplicateColleagues();
    //                 }, 2000);
    //             });
    //         });
    //     }
    // }, []);

    return (
        <Shell currentView={currentView} setView={setCurrentView}>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'timelines' && <TimelineView />}
            {currentView === 'kanban' && <KanbanBoard />}
            {currentView === 'gantt' && <GanttChart />}
            {currentView === 'projects' && <ProjectList />}
            {currentView === 'lone-tasks' && <LoneTasks />}
            {currentView === 'team' && <Directory />}
        </Shell>
    );
}



export default App;



