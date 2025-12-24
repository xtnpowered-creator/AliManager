import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Shell from './components/Shell';
import { TimelineViewProvider } from './context/TimelineViewContext';
import { DataProvider } from './context/DataContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import TimelineSkeleton from './components/TimelineSkeleton';

// Lazy Load Pages
const MyDashboard = React.lazy(() => import('./pages/MyDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const TimelineView = React.lazy(() => import('./pages/TimelineView'));
const KanbanBoard = React.lazy(() => import('./components/KanbanBoard'));
const GanttChart = React.lazy(() => import('./components/GanttChart'));
const ProjectList = React.lazy(() => import('./components/ProjectList'));
const LoneTasks = React.lazy(() => import('./components/LoneTasks'));
const Directory = React.lazy(() => import('./components/Directory'));
const TaskDetailView = React.lazy(() => import('./components/TaskDetailView'));

// Wrapper to inject Navigation Props into Shell
const AppShell = () => {
    return (
        <Shell>
            <Suspense fallback={<div className="p-8"><TimelineSkeleton /></div>}>
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
            </Suspense>
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
                <QueryClientProvider client={queryClient}>
                    <TimelineViewProvider>
                        <DataProvider>
                            <AppShell />
                        </DataProvider>
                    </TimelineViewProvider>
                </QueryClientProvider>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
