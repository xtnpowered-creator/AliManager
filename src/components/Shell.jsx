import React, { useEffect } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import Navigation from './Navigation';
import Logo from './Logo';
import { useAuth, MOCK_USERS } from '../context/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { ChevronDown, RefreshCcw, LogOut } from 'lucide-react'; // Added Icons

const Shell = ({ children }) => {
    const { user, switchUser } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);

    // Custom Login Helper (Restored)
    useEffect(() => {
        window.loginGod = async () => {
            console.log("Global Login Triggered");
            try {
                await signInWithEmailAndPassword(auth, 'xtnpowered@gmail.com', 'password123');
                alert("LOGIN SUCCESS!");
            } catch (e) {
                console.warn("Login failed, creating...", e);
                try {
                    await createUserWithEmailAndPassword(auth, 'xtnpowered@gmail.com', 'password123');
                    alert("CREATED & LOGGED IN!");
                } catch (createErr) {
                    alert("ERROR: " + createErr.message);
                }
            }
        };
    }, []);

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleSignOut = async () => {
        try {
            if (import.meta.env.DEV) {
                localStorage.removeItem('mockUserId');
                window.location.reload();
            } else {
                await signOut(auth);
            }
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col selection:bg-teal-100 selection:text-teal-900" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            {/* FIXED LOGIN BUTTON REMOVED (Use window.loginGod() in console if needed) */}
            <header className="h-16 backdrop-blur-md flex items-center sticky top-0 z-[100] p-0" style={{ borderBottom: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)' }}>
                {/* Fixed Logo/Brand area matching sidebar width */}
                <div className="w-72 h-full flex items-center px-8 shrink-0 backdrop-blur z-[101]" style={{ borderRight: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-elevated)' }}>
                    <div className="flex items-center gap-3">
                        <Logo className="w-12 h-12" />
                        <h1 className="text-3xl font-bold tracking-tight">
                            <span style={{ color: 'var(--accent-primary)' }}>Ali</span>
                            <span style={{ color: 'var(--text-primary)' }}>Manager</span>
                        </h1>
                    </div>
                </div>

                {/* Flexible UI area for Search and Profile */}
                <div className="flex-1 flex items-center justify-between px-6">
                    <div className="flex items-center px-4 py-2 rounded-xl w-80 group focus-within:ring-2 transition-all" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
                        <Search className="text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search projects, tasks, or directory..."
                            className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 font-medium outline-none" style={{ color: 'var(--text-secondary)' }}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <Bell size={20} />
                        </button>
                        <div className="h-4 w-[1px] bg-slate-300 mx-2"></div>
                        <div className="relative">
                            <div
                                className="flex items-center gap-3 pl-2 cursor-pointer"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-slate-900">{user?.displayName || user?.email || 'Guest'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-teal-600 leading-none">
                                        {user?.role === 'god' ? 'System God' : (user?.role || 'Member')}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-transform active:scale-95" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--text-inverse)', boxShadow: 'var(--shadow-md)' }}>
                                    {getInitials(user?.displayName || user?.email)}
                                </div>
                                <ChevronDown size={14} className="text-slate-400" />
                            </div>

                            {/* Profile Dropdown */}
                            {showProfileMenu && (
                                <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-[200]">
                                    {import.meta.env.DEV && (
                                        <div className="mb-2 pb-2 border-b border-slate-100">
                                            <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Dev: Switch User</p>
                                            {MOCK_USERS.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => {
                                                        switchUser(u.id);
                                                        setShowProfileMenu(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${user?.id === u.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    {u.label}
                                                    {user?.id === u.id && <div className="w-2 h-2 rounded-full bg-teal-500"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        onClick={handleSignOut}
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="relative z-[90] h-full shadow-[1px_0_20px_0_rgba(0,0,0,0.05)]">
                    <Navigation />
                </div>
                <main className="flex-1 overflow-hidden relative z-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Shell;
