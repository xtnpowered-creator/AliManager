import React from 'react';
import { Calendar } from 'lucide-react';

const TimelineControls = ({ onTodayClick, onGoToFirst, showGoToFirst, scale, onScaleClick, className = "" }) => {
    return (
        <div className={`flex flex-col gap-1 shrink-0 ${className}`}>
            <button
                onClick={onTodayClick}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 border border-teal-300 rounded-lg text-xs font-black text-teal-900 hover:bg-teal-100 transition-all shadow-sm group"
            >
                <Calendar size={14} className="text-teal-600 group-hover:scale-110 transition-transform" />
                TODAY
            </button>
            <button
                onClick={showGoToFirst ? onGoToFirst : undefined}
                disabled={!showGoToFirst}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all shadow-sm border group
                    ${showGoToFirst
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                        : 'bg-slate-50 border-slate-300 text-slate-400 cursor-not-allowed'
                    }`}
            >
                FIRST MATCH
            </button>
            <button
                onClick={onScaleClick}
                className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2 text-center hover:text-teal-600 hover:bg-teal-50 rounded cursor-pointer transition-colors select-none"
                title="Click to set custom density"
            >
                {(scale / 96).toFixed(2)} IN / DAY
            </button>
        </div>
    );
};

export default TimelineControls;
