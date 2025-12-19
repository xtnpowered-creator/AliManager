import { LayoutDashboard, Calendar, Columns, BarChart3, Users, Settings, FolderKanban, ListTodo, ShieldAlert } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../context/AuthContext';

const Navigation = ({ currentView, setView }) => {
    const { data: colleagues } = useApiData('/colleagues'); // Cached or fetched
    const { user } = useAuth();

    const dbUser = colleagues.find(c => c.id === user?.uid);
    const isAdmin = dbUser?.role === 'god' || dbUser?.role === 'admin';

    const menuItems = [
        {
            group: 'Main Views', items: [
                { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                { id: 'timelines', icon: <Calendar size={20} />, label: 'Timelines' },
                { id: 'kanban', icon: <Columns size={20} />, label: 'Kanban Board' },
                { id: 'gantt', icon: <BarChart3 size={20} />, label: 'Gantt Chart' },
            ]
        },
        {
            group: 'Management', items: [
                { id: 'projects', icon: <FolderKanban size={20} />, label: 'Projects' },
                { id: 'lone-tasks', icon: <ListTodo size={20} />, label: 'Lone Tasks' },
                { id: 'team', icon: <Users size={20} />, label: 'Directory' },
            ]
        },
        {
            group: 'System', items: [
                ...(isAdmin ? [{ id: 'admin', icon: <ShieldAlert size={20} />, label: 'Admin Dash' }] : []),
                { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
            ]
        }
    ];

    return (
        <aside className="w-72 border-r border-slate-200 bg-white flex flex-col h-full overflow-y-auto">
            <div className="p-8 space-y-8">
                {menuItems.map((group, idx) => (
                    <div key={idx} className="space-y-3">
                        <h5 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {group.group}
                        </h5>
                        <nav className="space-y-1">
                            {group.items.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setView(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${currentView === item.id
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                ))}
            </div>

            <div className="mt-auto p-6 border-t border-slate-100">
                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                    <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-medium text-teal-600">All systems sync'd</p>
                </div>
            </div>
        </aside>
    );
};

export default Navigation;
