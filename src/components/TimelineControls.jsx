import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * TimelineControls Component
 * 
 * Navigation buttons for timeline views (jump to today, first match, custom zoom).
 * Reused across TimelinesPage, MyDashboard, and other timeline-based views.
 * 
 * Features:
 * 1. **TODAY Button**: Scrolls to current date
 * 2. **FIRST MATCH Button**: Jumps to earliest filtered task (conditional)
 * 3. **Scale Indicator**: Shows current zoom, opens scale modal on click
 * 
 * "First Match" Logic:
 * - Only enabled when filters active (taskFilters.length > 0)
 * - Disabled state: Gray, cursor-not-allowed
 * - Enabled state: Green, hover effect
 * - Parent computes earliest task date, passes onGoToFirst callback
 * 
 * Scale Display:
 * - Shows zoom as "inches per day" (scale / 96 pixels)
 * - Example: 96px = 1.00 IN / DAY, 192px = 2.00 IN / DAY
 * - Clickable to open CustomScaleModal
 * 
 * Visual Design:
 * - Stacked vertical layout (flex-col gap-1)
 * - Color-coded buttons (teal = today, emerald = first match)
 * - Hover animations (scale, background color transitions)
 * - Shadow + border for depth
 * 
 * @param {Object} props
 * @param {Function} props.onTodayClick - Callback to scroll to today
 * @param {Function} props.onGoToFirst - Callback to scroll to first filtered task
 * @param {boolean} props.showGoToFirst - Enable/disable first match button
 * @param {number} props.scale - Current timeline scale (pixels per weekday)
 * @param {Function} props.onScaleClick - Callback to open scale modal
 * @param {string} [props.className=''] - Additional CSS classes
 */
const TimelineControls = ({ onTodayClick, onGoToFirst, showGoToFirst, scale, onScaleClick, className = "" }) => {
    return (
        <div className={`flex flex-col gap-1 shrink-0 ${className}`}>
            {/* TODAY Button */}
            <button
                onClick={onTodayClick}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 border border-teal-300 rounded-lg text-xs font-black text-teal-900 hover:bg-teal-100 transition-all shadow-sm group"
            >
                <Calendar size={14} className="text-teal-600 group-hover:scale-110 transition-transform" />
                TODAY
            </button>

            {/* FIRST MATCH Button (conditional) */}
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

            {/* Scale Indicator (clickable) */}
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
