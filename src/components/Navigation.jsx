import { LayoutDashboard, Calendar, Columns, BarChart3, Users, Settings, FolderKanban, ListTodo, ShieldAlert } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';
import { useToast, useToastState } from '../context/ToastContext';
import Toast from './Toast';

import { Link, useLocation } from 'react-router-dom';

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
