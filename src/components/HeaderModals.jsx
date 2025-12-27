import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Maximize2, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

/**
 * Timeline Header Utility Modals
 * 
 * PURPOSE:
 * Collection of three timeline navigation/customization modals:
 * 1. GoToDateModal: Jump to specific date on timeline
 * 2. CustomScaleModal: Adjust timeline density (zoom)
 * 3. FlagModal: Mark important dates (placeholder)
 * 
 * SHARED ARCHITECTURE:
 * All three modals use ModalShell wrapper for consistent:
 * - Portal rendering (z-index 10000)
 * - Framer Motion animations (fade + scale)
 * - Header layout (icon + title + close button)
 * - Styling (rounded, shadow, borders)
 * 
 * Benefit: Single source of truth for modal UI patterns
 */

/**
 * Modal Shell Component - Shared Wrapper
 * 
 * Provides consistent modal container for all HeaderModals.
 * Handles portal rendering, animations, and close button.
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Close callback
 * @param {string} title - Modal title text
 * @param {Component} icon - Lucide icon component for header
 * @param {ReactNode} children - Modal content
 */
// Shared Modal Shell
const ModalShell = ({ isOpen, onClose, title, icon: Icon, children }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-slate-700">
                            <Icon size={16} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">
                    {children}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

/**
 * Go To Date Modal
 * 
 * PURPOSE:
 * Allows user to jump to any date on timeline instantly.
 * Useful for navigating to far-future or far-past dates without scrolling.
 * 
 * USE CASES:
 * - "Jump to project deadline 6 months from now"
 * - "View last year's completed tasks"
 * - "Check holiday schedule for next quarter"
 * 
 * TIMEZONE HANDLING:
 * Critical: Parses date string as LOCAL time, not UTC.
 * 
 * Problem with new Date(dateString):
 * - Input: "2025-12-25"
 * - Interpreted as UTC midnight: "2025-12-25T00:00:00Z"
 * - Converted to local (e.g., EST): "2025-12-24T19:00:00-05:00"
 * - Result: Jump to December 24 instead of December 25!
 * 
 * Solution:
 * - Manually parse "YYYY-MM-DD" into year, month, day
 * - Create Date with local constructor: new Date(year, month-1, day)
 * - Set to local midnight: setHours(0, 0, 0, 0)
 * - Result: Correct local date without timezone offset
 * 
 * DEFAULT VALUE:
 * Pre-fills with today's date on open (useEffect syncs to isOpen changes).
 * User can adjust with native date picker.
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Close callback
 * @param {Function} onGo - Callback with target Date object (local midnight)
 * 
 * @example
 * <GoToDateModal
 *   isOpen={showGoToDate}
 *   onClose={() => setShowGoToDate(false)}
 *   onGo={(targetDate) => {
 *     // Scroll timeline to targetDate
 *     scrollToDate(targetDate);
 *   }}
 * />
 */
export const GoToDateModal = ({ isOpen, onClose, onGo }) => {
    const [date, setDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setDate(today);
        }
    }, [isOpen]);

    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title="Go To Date" icon={Calendar}>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                </div>
                <button
                    onClick={() => {
                        // Parse date string as local time, not UTC
                        // date is "YYYY-MM-DD" format
                        const [year, month, day] = date.split('-').map(Number);
                        const targetDate = new Date(year, month - 1, day); // month is 0-indexed
                        targetDate.setHours(0, 0, 0, 0); // Ensure midnight local time

                        console.log('GoToDate modal:', {
                            dateString: date,
                            targetDate: targetDate.toISOString(),
                            targetDateString: targetDate.toDateString()
                        });
                        onGo(targetDate);
                        onClose();
                    }}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                    Jump to Date
                </button>
            </div>
        </ModalShell>
    );
};

/**
 * Custom Scale Modal - Timeline Density Adjuster
 * 
 * PURPOSE:
 * Allows users to customize timeline density (horizontal spacing).
 * Controls how much horizontal space each day occupies on screen.
 * 
 * SCALING SYSTEM: Inches Per Day
 * 
 * User input: Inches (physical measurement, intuitive)
 * Internal storage: Pixels (actual CSS units)
 * 
 * Conversion: 1 inch = 96 pixels (web standard DPI)
 * - User sets 1.25 inches/day
 * - System stores 120 pixels/day (1.25 × 96)
 * 
 * WHY INCHES:
 * - More intuitive than pixels for most users
 * - Physical metaphor: "How wide is each day?"
 * - Standard: 1.00-1.25 inches = comfortable reading
 * 
 * BOUNDS:
 * - Min: 0.33 inches (~32 pixels) - Very compact, fits many days
 * - Max: 5.00 inches (480 pixels) - Very spacious, detail view
 * - Step: 0.25 inches - Quarter-inch increments
 * 
 * AUTO-CLAMP:
 * onBlur validates and clamps input to min/max bounds.
 * Prevents invalid values like 0.1 or 10.0.
 * 
 * UX ENHANCEMENTS:
 * - Auto-focus + select on open (immediate typing)
 * - Enter to apply (quick workflow)
 * - Live validation on blur
 * - Helpful hint text with standard range
 * 
 * STATE SYNC:
 * useEffect converts currentScale (pixels) to density (inches) when modal opens.
 * Ensures form shows current value, not last-used value.
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Close callback
 * @param {Function} onApply - Callback with new scale in pixels
 * @param {number} currentScale - Current scale in pixels (for pre-fill)
 * 
 * @example
 * <CustomScaleModal
 *   isOpen={showCustomScale}
 *   onClose={() => setShowCustomScale(false)}
 *   currentScale={120} // 1.25 inches
 *   onApply={(newScale) => setTimelineScale(newScale)}
 * />
 */
export const CustomScaleModal = ({ isOpen, onClose, onApply, currentScale }) => {
    // Default to 1.25 if undefined
    const [density, setDensity] = useState(1.25);

    useEffect(() => {
        if (isOpen && currentScale) {
            // Convert Pixels -> Inches
            const inch = (currentScale / 96);
            // Round to nearest 0.25? Or just 2 decimals.
            setDensity(parseFloat(inch.toFixed(2)));
        }
    }, [isOpen, currentScale]);

    const handleApply = () => {
        // Convert Inches -> Pixels
        const pixelVal = Math.round(density * 96);
        onApply(pixelVal);
        onClose();
    };

    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title="Set Timeline Density" icon={Maximize2}>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Density (Inches per Day)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0.33"
                            max="5.0"
                            step="0.25"
                            value={density}
                            onChange={e => setDensity(e.target.value)}
                            onBlur={() => {
                                let val = parseFloat(density);
                                if (isNaN(val)) val = 1.25;
                                setDensity(Math.min(5.0, Math.max(0.33, val)));
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    handleApply();
                                }
                            }}
                            autoFocus
                            onFocus={e => e.target.select()}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                        <span className="text-sm font-bold text-slate-400">IN / DAY</span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-2">
                        Higher = More Spacious.<br />
                        Lower = More Compact.<br />
                        Standard is ~1.00 - 1.25 IN.
                    </p>
                </div>
                <button
                    onClick={handleApply}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                    Apply Density
                </button>
            </div>
        </ModalShell>
    );
};

/**
 * Flag Date Modal - Visual Date Markers (Placeholder)
 * 
 * PURPOSE:
 * (Future Feature) Mark important dates on timeline with custom labels and colors.
 * 
 * USE CASES:
 * - Holidays: "Christmas" (red), "Independence Day" (blue)
 * - Deadlines: "Q4 Report Due" (orange)
 * - Events: "Company All-Hands" (purple)
 * - Milestones: "Product Launch" (green)
 * 
 * COLOR PALETTE:
 * 6 preset colors for quick selection:
 * - Red (#fecaca): Urgent, holidays
 * - Orange (#fed7aa): Warnings, soft deadlines
 * - Yellow (#fde047): Important, attention needed
 * - Green (#bbf7d0): Positive, milestones
 * - Blue (#bfdbfe): Info, events
 * - Purple (#ddd6fe): Special, unique
 * 
 * CURRENT STATUS: PLACEHOLDER
 * - UI is complete and functional
 * - Backend not implemented
 * - Shows "Feature Coming Soon" toast
 * - Button is disabled (opacity-50, cursor-not-allowed)
 * 
 * FUTURE IMPLEMENTATION:
 * 1. Create `timeline_flags` table (date, label, color, userId)
 * 2. POST endpoint: /timeline-flags
 * 3. Fetch flags with timeline data
 * 4. Render flag overlay on timeline header
 * 5. Hover to show label tooltip
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Close callback
 * @param {Date} initialDate - Date to flag (from header right-click)
 * 
 * @example
 * <FlagModal
 *   isOpen={showFlagModal}
 *   onClose={() => setShowFlagModal(false)}
 *   initialDate={clickedDate} // From timeline header context menu
 * />
 */
export const FlagModal = ({ isOpen, onClose, initialDate }) => {
    const { showToast } = useToast();
    const [text, setText] = useState('Holiday');
    const [color, setColor] = useState('#fecaca'); // Red-200

    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title="Set Date Flag" icon={Flag}>
            <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                    <p className="text-xs font-medium text-slate-500">
                        Flagging for: <span className="font-bold text-slate-900">{initialDate?.toDateString()}</span>
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Flag Label</label>
                    <input
                        type="text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Color</label>
                    <div className="flex gap-2">
                        {['#fecaca', '#fed7aa', '#fde047', '#bbf7d0', '#bfdbfe', '#ddd6fe'].map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => { showToast('Feature Coming Soon!', 'info'); onClose(); }}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 opacity-50 cursor-not-allowed"
                >
                    Save Flag (Mock)
                </button>
            </div>
        </ModalShell>
    );
};
