import React from 'react';
import { X } from 'lucide-react';

const colors = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
};

const FilterChip = ({ label, onRemove, color = 'blue', icon: Icon }) => {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.blue} transition-colors`}>
            {Icon && <Icon size={12} className="opacity-70" />}
            <span>{label}</span>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="hover:bg-black/10 rounded p-0.5 transition-colors focus:outline-none"
            >
                <X size={12} />
            </button>
        </span>
    );
};

export default FilterChip;
