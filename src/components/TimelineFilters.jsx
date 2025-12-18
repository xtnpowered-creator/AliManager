import React from 'react';
import { Search, X } from 'lucide-react';

const TimelineFilters = ({
    filterText,
    setFilterText
}) => {
    return (
        <div className="flex items-center gap-4 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {/* Universal Search */}
            <div className="relative flex items-center group">
                <Search size={16} className="absolute left-3 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Filter by project, task or colleague..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:bg-white transition-all w-[380px]"
                />
                {filterText && (
                    <button
                        onClick={() => setFilterText('')}
                        className="absolute right-3 text-slate-400 hover:text-slate-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TimelineFilters;
