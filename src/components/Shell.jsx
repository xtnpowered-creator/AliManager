import { Search, Bell, Menu } from 'lucide-react';
import Navigation from './Navigation';
import Logo from './Logo';

const Shell = ({ children, currentView, setView }) => {
    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
            <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center sticky top-0 z-10 p-0">
                {/* Fixed Logo/Brand area matching sidebar width */}
                <div className="w-72 border-r border-slate-200 h-full flex items-center px-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <Logo className="w-12 h-12" />
                        <h1 className="text-3xl font-bold tracking-tight">
                            <span className="text-teal-600">Ali</span>
                            <span className="text-slate-900">Manager</span>
                        </h1>
                    </div>
                </div>

                {/* Flexible UI area for Search and Profile */}
                <div className="flex-1 flex items-center justify-between px-6">
                    <div className="flex items-center bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/50 w-80 group focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                        <Search className="text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search projects, tasks, or directory..."
                            className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 text-slate-600 placeholder:text-slate-400 font-medium outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <Bell size={20} />
                        </button>
                        <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900">Alisara Plyler</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-teal-600 leading-none">Admin</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-slate-200 transition-transform active:scale-95 cursor-pointer">
                                AP
                            </div>
                            <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <Navigation currentView={currentView} setView={setView} />
                <main className="flex-1 bg-[#f8fafc]/50 overflow-hidden relative">
                    {['timelines', 'kanban', 'gantt'].includes(currentView) ? children : (
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Shell;
