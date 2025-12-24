import React from 'react';
import { Calendar, SkipBack } from 'lucide-react';

const TimelineControls = ({ onTodayClick, onGoToFirst, showGoToFirst, scale, className = "" }) => {
    return (
        <div className={`flex flex-col items-center gap-1 shrink-0 ${className}`}>
            <button
                onClick={onTodayClick}
                className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg text-xs font-black text-teal-900 hover:bg-teal-100 transition-all shadow-sm group"
            >
                <Calendar size={14} className="text-teal-600 group-hover:scale-110 transition-transform" />
                TODAY
            </button>
            <button
                onClick={showGoToFirst ? onGoToFirst : undefined}
                disabled={!showGoToFirst}
                className={`flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold transition-all shadow-sm border
                    ${showGoToFirst
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                        : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
            >
                <SkipBack size={12} className={showGoToFirst ? "text-emerald-600" : "text-slate-300"} />
                FIRST MATCH
            </button>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-1">
                {scale >= 120 ? 'Wide' : (scale > 30 && scale <= 60) ? 'Compact' : 'Standard'} Zoom
            </div>
        </div>
    );
};

export default TimelineControls;
