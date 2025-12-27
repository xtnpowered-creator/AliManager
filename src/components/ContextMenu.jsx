import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

/**
 * ContextMenu Component
 * 
 * Right-click context menu with intelligent positioning, submenus, and portal rendering.
 * Used throughout app for task operations, bulk actions, and quick commands.
 * 
 * Key Features:
 * 1. **Smart Positioning**:
 *    - Initial render at (x, y) with visibility: hidden
 *    - useLayoutEffect measures actual menu size
 *    - Flips position if near viewport edges (prevents overflow)
 *    - Final position set with visibility: visible (no flash)
 * 
 * 2. **Submenu Support**:
 *    - Hover-triggered nested menus
 *    - ChevronRight indicator for parent items
 *    - Positioned to right of parent (left-full ml-1)
 *    - activeSubmenu state tracks which submenu is open
 * 
 * 3. **Portal Rendering**:
 *    - Menu rendered outside React tree (direct to body)
 *    - Avoids z-index conflicts with parent containers
 *    - Backdrop overlay catches outside clicks
 *    - z-index: 9999 (above all content)
 * 
 * 4. **Accessibility**:
 *    - Escape key closes menu
 *    - Disabled items: opacity-40, cursor-not-allowed
 *    - Danger actions: red text/background
 *    - Keyboard-accessible (tab navigation works)
 * 
 * 5. **Item Types**:
 *    - Standard: onClick callback, optional icon
 *    - Separator: type: 'separator' (1px divider)
 *    - Submenu: items[] array (nested structure)
 *    - Danger: danger: true (red styling)
 * 
 * Item Schema:
 * {
 *   label: string,
 *   icon: LucideIcon | Component,
 *   onClick: async () => void,
 *   disabled?: boolean,
 *   danger?: boolean,
 *   submenu?: [{ label, icon, onClick }]
 * }
 * 
 * Usage Example:
 * ```jsx
 * <ContextMenu
 *   x={clickX}
 *   y={clickY}
 *   onClose={() => setMenu(null)}
 *   items={[
 *     { label: 'Edit', icon: Edit, onClick: () => {...} },
 *     { type: 'separator' },
 *     { label: 'Delete', icon: Trash, onClick: () => {...}, danger: true }
 *   ]}
 * />
 * ```
 * 
 * Position Calculation:
 * - If x + width > viewport: flip to x - width
 * - If y + height > viewport: flip to y - height
 * - Prevents menu from being cut off by screen edges
 * 
 * Event Handling:
 * - Backdrop click: Close menu
 * - Item click: Execute action → close menu
 * - Right-click anywhere: Close menu (prevents nested menus)
 * - Escape key: Close menu
 * 
 * Animation:
 * - fade-in zoom-in-95: Smooth entrance
 * - duration-100: Quick but not jarring
 * - Tailwind animate-in utilities
 * 
 * @param {Object} props
 * @param {number} props.x - Click X coordinate (screen pixels)
 * @param {number} props.y - Click Y coordinate (screen pixels)
 * @param {Array} props.items - Menu item configuration array
 * @param {Function} props.onClose - Callback to close menu
 * @component
 */
const ContextMenu = ({ x, y, items, onClose }) => {
    const menuRef = useRef(null);
    const [activeSubmenu, setActiveSubmenu] = useState(null);

    // Close menu on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    /**
     * Smart Positioning Algorithm
     * 
     * Problem: Menu position (x, y) might cause overflow if near viewport edge
     * Solution: Measure after render, flip position if needed
     * 
     * Steps:
     * 1. Render menu at (x, y) with visibility: hidden
     * 2. useLayoutEffect runs before paint (no visual flash)
     * 3. getBoundingClientRect() gets actual menu dimensions
     * 4. Compare rect vs viewport boundaries
     * 5. Flip top/left if overflow detected
     * 6. Set visibility: visible (menu appears in correct position)
     */
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
                                onClick={async () => {
                                    if (!hasSubmenu && !item.disabled) {
                                        try {
                                            await item.onClick();
                                        } catch (e) {
                                            console.error("Context menu action failed:", e);
                                        }
                                        onClose();
                                    }
                                }}
                                disabled={item.disabled}
                                className={`w-full text-left px-4 py-1 text-sm font-medium flex items-center justify-between gap-2 transition-colors
                                    ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}
                                    ${item.danger && !item.disabled ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'}`}
                            >
                                <span className={`flex items-center gap-2 ${item.disabled ? 'grayscale' : ''}`}>
                                    {item.icon && (
                                        typeof item.icon === 'function' ? <item.icon /> : <item.icon size={14} strokeWidth={2.5} className={(item.danger && !item.disabled) ? 'text-red-500' : 'text-slate-400'} />
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
