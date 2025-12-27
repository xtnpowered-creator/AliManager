import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Shell from './components/Shell';
import { TimelineViewProvider } from './context/TimelineViewContext';
import { DataProvider } from './context/DataContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import TimelineSkeleton from './components/TimelineSkeleton';

/**
 * App Component
 * 
 * Root application component that sets up routing, providers, and lazy-loaded pages.
 * 
 * Provider Hierarchy (outer to inner):
 * 1. ErrorBoundary: Catches and displays errors (prevents WSOD)
 * 2. Router (BrowserRouter): Enables client-side routing
 * 3. QueryClientProvider: React Query cache/state management
 * 4. TimelineViewProvider: Timeline scroll state persistence
 * 5. DataProvider: Global data fetching/caching (tasks, colleagues, projects)
 * 6. Shell: App layout (header, navigation, content area)
 * 
 * Why This Order?
 * - ErrorBoundary wraps everything (catch all errors)
 * - Router needed before any components use useNavigate/useLocation
 * - QueryClient needed before useQuery hooks
 * - TimelineViewProvider before components that use timeline scroll state
 * - DataProvider before components that need tasks/colleagues
 * - Shell wraps all pages (provides consistent UI chrome)
 * 
 * Lazy Loading:
 * - All page components lazy-loaded via React.lazy
 * - Reduces initial bundle size (faster first paint)
 * - Suspense fallback shows skeleton during load
 * - Pages only loaded when navigated to
 * 
 * Routes:
 * - / → Redirects to /my-dashboard
 * - /my-dashboard → Personal timeline (filtered to current user)
 * - /admin-dashboard → Admin-only view (all colleagues)
 * - /timelines → Full team timeline view
 * - /kanban → Kanban board (todo/doing/done columns)
 * - /gantt → Gantt chart (project timeline visualization)
 * - /projects → Project list/management
 * - /lone-tasks → Standalone tasks (no project)
 * - /team → Team directory/org chart
 * - /task/:taskId → Task detail modal
 * 
 * Navigation Pattern:
 * - TaskDetailPage wrapper reads taskId from URL params
 * - onBack={() => navigate(-1)} returns to previous view
 * - Preserves scroll position and filters via browser history
 */

// Lazy Load Pages (code-splitting)
const MyDashboard = React.lazy(() => import('./pages/MyDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const TimelinesPage = React.lazy(() => import('./pages/TimelinesPage'));
const KanbanBoard = React.lazy(() => import('./components/KanbanBoard'));
const GanttChart = React.lazy(() => import('./components/GanttChart'));
const ProjectList = React.lazy(() => import('./components/ProjectList'));
const LoneTasks = React.lazy(() => import('./components/LoneTasks'));
const Directory = React.lazy(() => import('./components/Directory'));
const TaskDetailView = React.lazy(() => import('./components/TaskDetailView'));

/**
 * AppShell - Wrapper combining Shell layout with Routes
 * Rendered after all providers initialized
 */
const AppShell = () => {
    return (
        <Shell>
            <Suspense fallback={<div className="p-8"><TimelineSkeleton /></div>}>
                <Routes>
                    <Route path="/" element={<Navigate to="/my-dashboard" replace />} />
                    <Route path="/my-dashboard" element={<MyDashboard />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/timelines" element={<TimelinesPage />} />
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

/**
 * TaskDetailPage - Wrapper for task detail view
 * Extracts taskId from URL params and provides navigation callback
 */
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
