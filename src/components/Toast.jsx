import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast Component
 * 
 * Animated notification component with type-based styling (success/error/info).
 * Used by ToastContext to display temporary messages in the bottom of the Navigation sidebar.
 * 
 * Features:
 * - Framer Motion animations (fade + scale on enter/exit)
 * - Auto-dismissable after timeout (managed by ToastContext)
 * - Manual dismiss via close button
 * - Color-coded by message type
 * 
 * Types:
 * - success: Green (emerald) - Task completed, save successful
 * - error: Red (rose) - Failed operations, validation errors
 * - info: Blue - Informational messages, tips
 * 
 * @param {Object} props
 * @param {string} props.message - Toast message text
 * @param {string} [props.type='success'] - Message type: 'success', 'error', or 'info'
 * @param {Function} props.onClose - Callback when close button clicked
 * @param {string} [props.className=''] - Additional CSS classes
 */
const Toast = ({ message, type = 'success', onClose, className = '' }) => {
    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={20} />,
        error: <AlertCircle className="text-rose-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const colors = {
        success: 'bg-emerald-50 border-emerald-100 text-emerald-900',
        error: 'bg-rose-50 border-rose-100 text-rose-900',
        info: 'bg-blue-50 border-blue-100 text-blue-900'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={`pointer-events-auto w-full p-3 rounded-xl border flex items-start gap-3 ${colors[type]} ${className}`}
        >
            <div className="shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <p className="flex-1 text-xs font-semibold leading-relaxed break-words">
                {message}
            </p>
            <button
                onClick={onClose}
                className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
                <X size={14} className="opacity-40" />
            </button>
        </motion.div>
    );
};

export default Toast;
