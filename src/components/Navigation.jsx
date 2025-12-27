import { LayoutDashboard, Calendar, Columns, BarChart3, Users, Settings, FolderKanban, ListTodo, ShieldAlert } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import { useToast, useToastState } from '../context/ToastContext';
import Toast from './Toast';

import { Link, useLocation } from 'react-router-dom';

/**
 * Navigation Component
 * 
 * Primary left sidebar navigation with grouped menu items, role-based visibility,
 * and integrated toast notification system.
 * 
 * Structure:
 * - **Fixed width**: 288px (w-72) to match Shell header logo area
 * - **Grouped menu**: Three sections (Main Views, Management, System)
 * - **Active indication**: Dark background + white text for current route
 * - **Toast display**: Stacked notifications at bottom of sidebar
 * 
 * Role-Based Rendering:
 * - **Admin Dashboard**: Only visible to god/admin users
 * - **Permission check**: Compares user.role + dbUser.role (handles both sources)
 * - **Fallback**: Non-admins see 8 standard menu items
 * 
 * Menu Groups:
 * 1. **Main Views**:
 *    - Admin Dashboard (conditional) - System oversight
 *    - My Dashboard - Personal task view
 *    - Timelines - Full team timeline
 *    - Kanban Board - Todo/Doing/Done columns
 *    - Gantt Chart - Project timeline visualization
 * 
 * 2. **Management**:
 *    - Projects - Project list/management
 *    - Lone Tasks - Unprojectnon-project tasks
 *    - Directory - Team member directory
 * 
 * 3. **System**:
 *    - Settings - User preferences/configuration
 * 
 * Active Route Detection:
 * - useLocation() hook tracks current path
 * - Exact match comparison (currentPath === item.path)
 * - Active styling: bg-slate-900 text-white shadow-lg
 * - Inactive styling: text-slate-500 hover:bg-slate-50
 * 
 * Toast Integration:
 * - Toast notifications render at sidebar bottom
 * - Auto-dismiss after timeout (managed by ToastContext)
 * - Manual dismiss via X button (calls removeToast)
 * - Positioned in border-t section (fixed to bottom)
 * 
 * Icon System:
 * - Lucide-react icons at 20px size
 * - Semantic icons (Calendar for timelines, Columns for kanban, etc.)
 * - ShieldAlert for admin-only items
 * - Consistent sizing across all menu items
 * 
 * Visual Design:
 * - Rounded corners (rounded-2xl) for modern aesthetic
 * - Hover states with bg-slate-50
 * - Smooth transitions (transition-all)
 * - Shadow on active item (shadow-lg shadow-slate-200)
 * - Uppercase tracking-widest group labels
 * 
 * Layout Hierarchy:
 * 1. Sidebar container (w-72 border-r)
 * 2. Scrollable content area (overflow-y-auto)
 * 3. Menu groups (space-y-8)
 * 4. Sticky bottom section (mt-auto border-t)
 * 5. Toast stack (flex-col gap-2)
 * 
 * Accessibility:
 * - Semantic navigation elements (<nav>)
 * - Link components for proper routing
 * - Clear visual hierarchy with group labels
 * - Focus states (handled by Link component)
 * 
 * @component
 */
const Navigation = () => {
    const location = useLocation();
    const currentPath = location.pathname;
    const { data: colleagues } = useApiData('/colleagues');
    const { user } = useAuth();
    const toasts = useToastState();
    const { removeToast } = useToast();

    const dbUser = colleagues.find(c => c.id === user?.uid);
    const isAdmin = user?.role === 'god' || user?.role === 'admin' || dbUser?.role === 'god' || dbUser?.role === 'admin';


    const menuItems = [
        {
            group: 'Main Views', items: [
                ...(isAdmin ? [{ path: '/admin-dashboard', icon: <ShieldAlert size={20} />, label: 'Admin Dashboard' }] : []),
                { path: '/my-dashboard', icon: <LayoutDashboard size={20} />, label: 'My Dashboard' },
                { path: '/timelines', icon: <Calendar size={20} />, label: 'Timelines' },
                { path: '/kanban', icon: <Columns size={20} />, label: 'Kanban Board' },
                { path: '/gantt', icon: <BarChart3 size={20} />, label: 'Gantt Chart' },
            ]
        },
        {
            group: 'Management', items: [
                { path: '/projects', icon: <FolderKanban size={20} />, label: 'Projects' },
                { path: '/lone-tasks', icon: <ListTodo size={20} />, label: 'Lone Tasks' },
                { path: '/team', icon: <Users size={20} />, label: 'Directory' },
            ]
        },
        {
            group: 'System', items: [
                // ...(isAdmin ? [{ id: 'admin', icon: <ShieldAlert size={20} />, label: 'Admin Dash' }] : []), // Moved to Top
                { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
            ]
        }
    ];

    return (
        <aside className="w-72 border-r border-slate-200 bg-white flex flex-col h-full overflow-y-auto relative">
            <div className="p-8 space-y-8">
                {menuItems.map((group, idx) => (
                    <div key={idx} className="space-y-3">
                        <h5 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {group.group}
                        </h5>
                        <nav className="space-y-1">
                            {group.items.map((item, i) => (
                                <Link
                                    key={i}
                                    to={item.path}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${currentPath === item.path
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                ))}
            </div>

            <div className="mt-auto flex flex-col gap-4 p-6 border-t border-slate-100">
                {/* Toasts Stack - Bottom Up */}
                <div className="flex flex-col gap-2 w-full">
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                            className="w-full shadow-sm border border-slate-200"
                        />
                    ))}
                </div>


            </div>
        </aside>
    );
};

export default Navigation;
