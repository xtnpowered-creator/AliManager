import React from 'react';
import { Calendar } from 'lucide-react';

const TimelineControls = ({ onTodayClick, scale, className = "" }) => {
    return (
        <div className={`flex flex-col items-center gap-1 shrink-0 ${className}`}>
            <button
                onClick={onTodayClick}
                className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg text-xs font-black text-teal-900 hover:bg-teal-100 transition-all shadow-sm group"
            >
                <Calendar size={14} className="text-teal-600 group-hover:scale-110 transition-transform" />
                TODAY
            </button>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">
                {scale >= 120 ? 'Wide' : (scale > 30 && scale <= 60) ? 'Compact' : 'Standard'} Zoom
            </div>
        </div>
    );
};

export default TimelineControls;
