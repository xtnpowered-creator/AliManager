import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import Navigation from './Navigation';

const Shell = ({ children, currentView, setView }) => {
    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
            <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-xs">A</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">AliManager</h1>
                    </div>

                    <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/50 w-80 group focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                        <Search className="text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search projects, tasks, or directory..."
                            className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 text-slate-600 placeholder:text-slate-400 font-medium outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <Bell size={20} />
                    </button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900">Alisara D.</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-teal-600 leading-none">Admin</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-slate-200 transition-transform active:scale-95 cursor-pointer">
                            AD
                        </div>
                        <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Menu size={24} />
                        </button>
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
