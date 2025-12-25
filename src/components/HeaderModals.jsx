import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Maximize2, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

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
                    onClick={() => { onGo(new Date(date)); onClose(); }}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                    Jump to Date
                </button>
            </div>
        </ModalShell>
    );
};

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
