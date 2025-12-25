import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Play, Layers, User, Square, Pause, Check } from 'lucide-react';
import { getTaskCardColor } from '../utils/cardStyles';
import { useAuth } from '../context/AuthContext';
import { useTimelineRegistry } from '../context/TimelineRegistryContext'; // Import Registry
import { CARD_VARIANTS } from '../styles/designSystem';

const TaskCard = ({
    task,
    index = 0, // Default to 0 to prevent NaN crashes if undefined
    left,
    currentDate,
    getColumnWidth,
    onTaskClick,
    onContextMenu,
    onTaskDoubleClick, // New Prop for Navigation
    variant = 'MICRO',
    isStatic = false, // Prop to force static positioning (Result of Expansion)
    scale, // '1w', '3w', etc
    stackIndex, // DEPRECATED: Removed in favor of hoverOffset
    hoverOffset = 0, // Precise pixel offset for hover alignment
    isExpanded = false, // New Prop: Persistently Expanded State
    isSelected = false // NEW: Selected state for bulk actions
}) => {
    const { user } = useAuth();
    const { registerTask, unregisterTask } = useTimelineRegistry(); // Use Registry
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    // Register Task with Context on Mount/Update
    React.useEffect(() => {
        if (cardRef.current && task.id) {
            registerTask(task.id, cardRef.current);
        }
        return () => {
            if (task.id) unregisterTask(task.id);
        };
    }, [task.id, registerTask, unregisterTask]);

    // Alternating horizontal offset (Visual interest for stacks)
    // Only applies to MICRO stacks usually, but kept for legacy/safety.
    const xStackOffset = index === 0 ? 0 : (index % 2 === 0 ? -3 : 3);

    // Stack Offset (Vertical): Only for MICRO cards (negative margin stack).
    // BUBBLE variant layout is handled by TimelineRow flex container.
    const stackOffset = variant === 'BUBBLE' ? 0 : (index * -6);

    // Fixed width as requested
    let cardWidth = 160;

    // Active State for Layout/Z-Index (Hover OR Expanded)
    const isActiveState = isHovered || isExpanded;

    // Details Mode: SHOW TEXT (Static Grid or Clicked Inline)
    // ONLY Click triggers this (isExpanded), NOT Hover.
    const showDetails = isStatic || isExpanded;

    // Access Source Check (Fix camelCase mismatch from API)
    const accessSrc = task.accessSource || task.access_source || 'member';
    const isOwner = ['owner', 'member', 'god'].includes(accessSrc);

    const icons = (
        <div className={`flex flex-col items-center justify-center gap-[3px] pointer-events-none absolute right-0 top-0 bottom-0 w-[23px]`}>
            {/* 1. Created by Me (Owner) -> Crown */}
            {/* God Mode: Do NOT show crown. Crown = "I created this". God has implicit power, not explicit ownership. */}
            <div className={`w-[15px] h-[15px] rounded-full border flex items-center justify-center ${(task.isOwner) ? 'border-slate-900 bg-white' : 'border-transparent bg-white/50'}`}>
                <Crown size={11} strokeWidth={2.5} className="text-slate-900 fill-slate-900" />
            </div>

            {/* 2. Assigned to Me -> User */}
            <div className={`w-[15px] h-[15px] rounded-full border flex items-center justify-center ${(task.assignedTo?.includes(user?.uid)) ? 'border-slate-900 bg-white' : 'border-transparent bg-white/50'}`}>
                <User size={11} strokeWidth={2.5} className="text-slate-900 fill-slate-900" />
            </div>

            {/* 3. Priority (Numeric 1-4 or Dash) */}
            <div className={`w-[15px] h-[15px] rounded-full border flex items-center justify-center ${['1', '2', '3', '4'].includes(String(task.priority || '')) ? 'border-slate-900 bg-white' : 'border-transparent bg-white/50'}`}>
                {(() => {
                    const p = String(task.priority || '');
                    if (['1', '2', '3', '4'].includes(p)) {
                        return <span className={`text-[9px] font-black leading-none ${p === '1' ? 'text-red-600' : 'text-slate-900'}`}>{p}</span>;
                    }
                    return <span className="text-[12px] font-black text-slate-900">-</span>; // Inactive / Legacy / None
                })()}
            </div>

            {/* 4. Status Multi-State: Pending (Square), Doing (Play), Paused (Pause), Done (Check) */}
            <div className={`w-[15px] h-[15px] rounded-full border flex items-center justify-center ${['doing', 'done'].includes(task.status) ? 'border-slate-900 bg-white' : 'border-transparent bg-white/50'}`}>
                {(() => {
                    // Normalize status
                    const s = (task.status || 'todo').toLowerCase();
                    if (s === 'doing') return <Play size={11} strokeWidth={2.5} className="text-slate-900 fill-slate-900 ml-0.5" />;
                    if (s === 'done') return <Check size={11} strokeWidth={4.5} className="text-slate-900" />; // No fill for check usually, just thick stroke
                    if (s === 'paused') {
                        // Custom SVG for wider gap
                        return (
                            <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-slate-900"
                            >
                                <rect x="5" y="4" width="4" height="16" />
                                <rect x="15" y="4" width="4" height="16" />
                            </svg>
                        );
                    }
                    // Default / Pending / Todo
                    return <Square size={8} strokeWidth={2.5} className="text-slate-900 fill-slate-900" />;
                })()}
            </div>

            {/* 5. Deliverables/Files -> Layers */}
            <div className={`w-[15px] h-[15px] rounded-full border flex items-center justify-center ${(task.hasAttachments || task.hasDeliverables) ? 'border-slate-900 bg-white' : 'border-transparent bg-white/50'}`}>
                <Layers size={11} strokeWidth={2.5} className="text-slate-900 fill-slate-900" />
            </div>
        </div>
    );

    // Override container class
    let containerClass;
    if (variant === 'CAPSULE') {
        if (showDetails) {
            containerClass = "rounded-[11.5px] border border-slate-900 w-full h-full block";
        } else {
            containerClass = CARD_VARIANTS.TIMELINE_CAPSULE.container.replace('rounded-full', 'rounded-[11.5px]');
        }
    } else if (variant === 'DAYVIEW_DETAILED') {
        containerClass = CARD_VARIANTS.DAYVIEW_DETAILED.container;
    } else {
        containerClass = CARD_VARIANTS.TIMELINE_BUBBLE.container;
    }

    return (
        <>
            <motion.div
                ref={cardRef}
                onContextMenu={(e) => {
                    if (onContextMenu) {
                        e.stopPropagation();
                        onContextMenu(e, task);
                    }
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onTaskClick) onTaskClick(task, e);
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (onTaskDoubleClick) onTaskDoubleClick(task);
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    left: (isStatic || variant === 'DAYVIEW_DETAILED') ? "auto" : "50%",
                    x: (isStatic || variant === 'DAYVIEW_DETAILED') ? 0 : "-50%",
                    top: "auto",
                    bottom: (isStatic || variant === 'DAYVIEW_DETAILED') ? "auto" : 0,

                    y: (isStatic || variant === 'DAYVIEW_DETAILED') ? 0 : (
                        (variant === 'BUBBLE' && isActiveState) ? hoverOffset : 0
                    ),

                    marginTop: (isStatic || variant === 'DAYVIEW_DETAILED') ? 0 : stackOffset,

                    // Width logic
                    width: (variant === 'DAYVIEW_DETAILED') ? "100%" : (showDetails ? cardWidth : (variant === 'BUBBLE' ? 25 : "100%")),

                    // Height logic
                    height: (variant === 'DAYVIEW_DETAILED') ? "100%" : ((variant === 'BUBBLE') ? (isActiveState ? 93 : 25) : 93),

                    zIndex: isActiveState ? 3000 : (variant === 'DAYVIEW_DETAILED' ? 0 : 100 - index),
                    originX: 0.5,
                    borderRadius: (variant === 'BUBBLE' && !isActiveState) ? "12.5px" : "11.5px"
                }}
                whileHover={{
                    zIndex: 3000,
                    height: (variant === 'DAYVIEW_DETAILED') ? "100%" : 93, // Prevent height jump on detailed
                    y: (variant === 'BUBBLE') ? hoverOffset : 0,
                    borderRadius: "11.5px",
                    transition: { duration: 0.15, ease: "easeOut", type: "tween" }
                }}
                className={`${(isStatic || variant === 'DAYVIEW_DETAILED') ? 'relative' : 'absolute'} pointer-events-auto task-card cursor-pointer p-0 group overflow-hidden ${containerClass} ${variant === 'CAPSULE' ? CARD_VARIANTS.TIMELINE_CAPSULE.interactive : (variant === 'DAYVIEW_DETAILED' ? CARD_VARIANTS.DAYVIEW_DETAILED.interactive : CARD_VARIANTS.TIMELINE_BUBBLE.interactive)} ${getTaskCardColor(task)} ${(isSelected) ? 'ring-2 ring-slate-900' : ''}`}
                data-task-id={task.id}
            >
                {/* Condition: Render Icons ONLY if NOT showing details (Collapsed) */}
                {(variant === 'CAPSULE' || variant === 'BUBBLE') && !showDetails ? (
                    <>
                        {/* Standard Icons Stack (Hidden in Bubble Mode unless hovered) */}
                        <div
                            className={`transition-opacity duration-200 ${(variant === 'BUBBLE' && !isActiveState) ? 'opacity-0' : 'opacity-100'}`}
                        >
                            {icons}
                        </div>

                        {/* Special Bubble Icon (Only shows in Bubble Mode REST state) */}
                        {variant === 'BUBBLE' && !isActiveState && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[15px] h-[15px] rounded-full border border-slate-900 bg-white flex items-center justify-center">
                                    <Check size={11} strokeWidth={4} className="text-slate-900" />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={`flex flex-col h-full w-full relative pl-[5px] pr-8 py-2 custom-scrollbar ${variant === 'DAYVIEW_DETAILED' ? 'justify-start overflow-y-auto' : 'justify-center overflow-hidden'}`}>
                        {icons}

                        {/* Title - Wrapped */}
                        <h4 className={`font-black text-slate-900 leading-[1.2] uppercase tracking-tight break-words mb-1 ${variant === 'DAYVIEW_DETAILED' ? 'text-[13px] line-clamp-2' : 'text-[12px] line-clamp-3'}`}>
                            {task.title}
                        </h4>

                        {/* Description - Brief */}
                        {task.description && (
                            <p className={`text-slate-900 font-bold leading-tight ${variant === 'DAYVIEW_DETAILED' ? 'text-[11px] line-clamp-3 opacity-80' : 'text-[10px] line-clamp-2'}`}>
                                {task.description}
                            </p>
                        )}
                    </div>
                )}
            </motion.div>
        </>
    );
};

export default React.memo(TaskCard);
