import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import PageLayout from '../components/layout/PageLayout';

const Settings = () => {
    const { theme, setTheme } = useTheme();

    const themes = [
        {
            id: 'light',
            name: 'Light',
            icon: Sun,
            description: 'Clean and bright',
            preview: 'bg-white border-slate-200'
        },
        {
            id: 'medium',
            name: 'Medium',
            icon: Sparkles,
            description: 'Silvery and sophisticated',
            preview: 'bg-slate-100 border-slate-300'
        },
        {
            id: 'dark',
            name: 'Dark',
            icon: Moon,
            description: 'Sleek and modern',
            preview: 'bg-slate-900 border-slate-700'
        }
    ];

    return (
        <PageLayout title="Settings" subtitle="Customize your AliManager experience">
            <div className="w-full max-w-4xl overflow-y-auto">

            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Theme Mode
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themes.map(({ id, name, icon: Icon, description, preview }) => {
                        const isActive = theme === id;

                        return (
                            <button
                                key={id}
                                onClick={() => setTheme(id)}
                                className={`
                  p-6 rounded-2xl border-2 transition-all text-left
                  hover:scale-105 active:scale-95
                  ${isActive
                                        ? 'border-accent-primary shadow-lg'
                                        : 'border-border-primary hover:border-border-secondary'
                                    }
                `}
                                style={{
                                    backgroundColor: 'var(--bg-elevated)',
                                    boxShadow: isActive ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className={`p-3 rounded-xl ${preview}`}
                                        style={{
                                            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                        }}
                                    >
                                        <Icon size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {name}
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                            {description}
                                        </p>
                                    </div>
                                </div>

                                {isActive && (
                                    <div
                                        className="text-sm font-medium flex items-center gap-2"
                                        style={{ color: 'var(--accent-primary)' }}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                                        Active
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    About Themes
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Your theme preference is saved locally and will persist across sessions.
                    All themes are designed for optimal readability and visual hierarchy.
                </p>
            </section>
            </div>
        </PageLayout>
    );
};

export default Settings;
