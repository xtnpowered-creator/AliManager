import React from 'react';

/**
 * TimelineSkeleton Component
 * 
 * Loading placeholder for timeline views (Suspense fallback).
 * Mimics UnifiedTimelineBoard structure to prevent layout shift.
 * 
 * Structure:
 * - Header: Title + subtitle + controls placeholders
 * - Timeline Grid:
 *   - Date header row (10 columns with day/date/weekday)
 *   - 6 colleague rows (avatar + name + task placeholders)
 * 
 * Visual Design:
 * - Pulsing animation (animate-pulse)
 * - Slate-colored boxes (varying opacity for depth)
 * - Rounded corners match real components
 * - Maintains exact dimensions (prevents height jank)
 * 
 * Used By:
 * - App.jsx: Suspense fallback for lazy-loaded pages
 * - TimelinesPage: Initial load state
 * - MyDashboard: Timeline section loading
 * 
 * Why This Approach?
 * - Better UX than spinner (shows expected layout)
 * - Prevents cumulative layout shift (CLS)
 * - Familiar pattern (users recognize as loading)
 * 
 * @component
 */
const TimelineSkeleton = () => {
    return (
        <div className="p-8 h-full flex flex-col space-y-6 overflow-hidden animate-pulse">
            <header className="flex items-center justify-between gap-8 h-20">
                <div className="shrink-0 space-y-2">
                    <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
                    <div className="h-6 w-80 bg-slate-100 rounded-lg"></div>
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="h-12 w-96 bg-slate-100 rounded-2xl"></div>
                </div>
                <div className="h-14 w-40 bg-slate-100 rounded-2xl"></div>
            </header>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Header Row */}
                <div className="flex border-b border-slate-200 h-[73px]">
                    <div className="w-[200px] border-r border-slate-300 bg-slate-50 flex items-center px-6">
                        <div className="h-4 w-20 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="flex flex-1">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex-1 border-r border-slate-200 flex flex-col items-center justify-center p-2 space-y-2">
                                <div className="h-2 w-8 bg-slate-100 rounded-full"></div>
                                <div className="h-5 w-5 bg-slate-200 rounded-sm"></div>
                                <div className="h-2 w-8 bg-slate-100 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Colleague Rows */}
                <div className="flex-1 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex border-b border-slate-200 h-24 items-center">
                            <div className="w-[200px] border-r border-slate-200 px-6 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                                <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
                            </div>
                            <div className="flex-1 flex items-center px-10 gap-8">
                                <div className="h-12 flex-1 bg-slate-50 rounded-2xl"></div>
                                <div className="h-8 w-24 bg-slate-100 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TimelineSkeleton;
