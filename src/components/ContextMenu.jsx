import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

const ContextMenu = ({ x, y, items, onClose }) => {
    const menuRef = useRef(null);
    const [activeSubmenu, setActiveSubmenu] = useState(null);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Smart Positioning (Logic remains the same, omitted for brevity if unchanged, but I must replace the whole component to be safe or target specific lines. I'll replace the main return logic.)
    React.useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const { innerWidth, innerHeight } = window;

            // Basic Boundary Checks
            if (y + rect.height > innerHeight) menuRef.current.style.top = `${y - rect.height}px`;
            else menuRef.current.style.top = `${y}px`;

            if (x + rect.width > innerWidth) menuRef.current.style.left = `${x - rect.width}px`;
            else menuRef.current.style.left = `${x}px`;

            menuRef.current.style.visibility = 'visible';
        }
    }, [x, y, items]);

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[9998] cursor-default"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                onContextMenu={(e) => { e.preventDefault(); onClose(); }}
            />
            <div
                ref={menuRef}
                style={{ top: y, left: x, visibility: 'hidden' }}
                className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
            >
                {items.map((item, idx) => {
                    if (item.type === 'separator') {
                        return <div key={idx} className="h-[1px] bg-slate-100 my-1" />;
                    }

                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isSubmenuOpen = activeSubmenu === idx;

                    return (
                        <div
                            key={idx}
                            className="relative"
                            onMouseEnter={() => setActiveSubmenu(idx)}
                            onMouseLeave={() => setActiveSubmenu(null)}
                        >
                            <button
                                onClick={() => {
                                    if (!hasSubmenu) {
                                        item.onClick();
                                        onClose();
                                    }
                                }}
                                className={`w-full text-left px-4 py-1 text-sm font-medium flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors
                                    ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'}`}
                            >
                                <span className="flex items-center gap-2">
                                    {item.icon && (
                                        typeof item.icon === 'function' ? <item.icon /> : <item.icon size={14} strokeWidth={2.5} className={item.danger ? 'text-red-500' : 'text-slate-400'} />
                                    )}
                                    {item.label}
                                </span>
                                {hasSubmenu && <ChevronRight size={12} className="text-slate-400" />}
                            </button>

                            {/* Submenu */}
                            {hasSubmenu && isSubmenuOpen && (
                                <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
                                    {item.submenu.map((subItem, subIdx) => (
                                        <button
                                            key={subIdx}
                                            onClick={() => {
                                                subItem.onClick();
                                                onClose();
                                            }}
                                            className="w-full text-left px-4 py-1.5 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                                        >
                                            {subItem.icon && (
                                                typeof subItem.icon === 'function' ? <subItem.icon /> : <subItem.icon size={14} strokeWidth={2.5} className="text-slate-400" />
                                            )}
                                            {subItem.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>,
        document.body
    );
};

export default ContextMenu;
