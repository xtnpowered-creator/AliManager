import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Shell from './components/Shell';
import MyDashboard from './components/MyDashboard';
import AdminDashboard from './components/AdminDashboard';
import TimelineView from './components/TimelineView';
import KanbanBoard from './components/KanbanBoard';
import GanttChart from './components/GanttChart';
import ProjectList from './components/ProjectList';
import LoneTasks from './components/LoneTasks';
import Directory from './components/Directory';
import TaskDetailView from './components/TaskDetailView';
import { TimelineViewProvider } from './context/TimelineViewContext';
import { DataProvider } from './context/DataContext';

// Wrapper to inject Navigation Props into Shell
const AppShell = () => {
    return (
        <Shell>
            <Routes>
                <Route path="/" element={<Navigate to="/my-dashboard" replace />} />
                <Route path="/my-dashboard" element={<MyDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/timelines" element={<TimelineView />} />
                <Route path="/kanban" element={<KanbanBoard />} />
                <Route path="/gantt" element={<GanttChart />} />
                <Route path="/projects" element={<ProjectList />} />
                <Route path="/lone-tasks" element={<LoneTasks />} />
                <Route path="/team" element={<Directory />} />
                <Route path="/task/:taskId" element={<TaskDetailPage />} />
            </Routes>
        </Shell>
    );
};

// Wrapper for Task Detail to handle back navigation
const TaskDetailPage = () => {
    const navigate = useNavigate();
    const { taskId } = useParams();

    return (
        <TaskDetailView
            taskId={taskId}
            onBack={() => navigate(-1)}
        />
    );
};

function App() {
    return (
        <ErrorBoundary>
            <Router>
                <TimelineViewProvider>
                    <DataProvider>
                        <AppShell />
                    </DataProvider>
                </TimelineViewProvider>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
