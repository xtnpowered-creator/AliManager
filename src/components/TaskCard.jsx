import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, GripVertical } from 'lucide-react';
import { getTaskCardColor } from '../utils/cardStyles';

const TaskCard = ({
    task,
    index,
    left,
    currentDate,
    currentColleagueId,
    colleagues,
    colleagueIndex,
    getColumnWidth,
    onUpdate,
    setScrollDirection,
    scrollContainerRef,
    draggingTask,
    setDraggingTask,
    ghostRef,
    onReassign,
    days,
    scale
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    // Alternating horizontal offset: even indices go left (-3px), odd go right (+3px)
    const xStackOffset = index === 0 ? 0 : (index % 2 === 0 ? -3 : 3);
    const stackOffset = index * -6; // Stack UP (negative margin)
    const rowHeight = 160;
    const personnelColWidth = 200;

    // Calculate width based on duration
    const duration = task.duration || 1;
    let cardWidth = 0;
    const startDate = new Date(currentDate);

    for (let i = 0; i < duration; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        cardWidth += getColumnWidth(d);
    }
    cardWidth -= 12; // Gap between tasks to prevent touching across days
    cardWidth = cardWidth * 0.95; // Constrain to 95% to prevent overlap with stacked cards

    // Calculate hover width (what it would be on the 1 WEEK scale)
    // 1W column width is 233px. Gap is 12px.
    const hoverWidth = scale === '1w' ? cardWidth : (duration * 233) - 12;

    // Use ref to store drag data so event handlers can access current values
    const dragDataRef = useRef(null);

    const handleMouseDown = (e) => {
        e.stopPropagation();

        // Calculate offset from top-left of card
        const rect = cardRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        dragDataRef.current = {
            taskId: task.id,
            startX: e.clientX,
            startY: e.clientY,
            startScrollLeft: scrollContainerRef.current.scrollLeft,
            startScrollTop: scrollContainerRef.current.scrollTop,
            startDate: currentDate,
            startColleagueId: currentColleagueId,
            startColleagueIndex: colleagueIndex,
            offsetX,
            offsetY
        };

        setDraggingTask({
            task,
            x: e.clientX,
            y: e.clientY,
            startDate: currentDate,
            startColleagueId: currentColleagueId,
            startColleagueIndex: colleagueIndex,
            offsetX,
            offsetY,
            width: cardWidth
        });

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = (e) => {
        // Update ghost position directly via DOM for smooth 60fps movement
        if (ghostRef.current && dragDataRef.current) {
            const { offsetX, offsetY } = dragDataRef.current;
            ghostRef.current.style.left = `${e.clientX - offsetX}px`;
            ghostRef.current.style.top = `${e.clientY - offsetY}px`;
        }

        // Auto-scroll logic
        if (!scrollContainerRef.current) return;
        const rect = scrollContainerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const leftLimit = personnelColWidth + 80;
        const rightLimit = rect.width - 80;

        if (relativeX < leftLimit) {
            setScrollDirection(-1);
        } else if (relativeX > rightLimit) {
            setScrollDirection(1);
        } else {
            setScrollDirection(0);
        }
    };

    const handleGlobalMouseUp = (e) => {
        setScrollDirection(0);
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);

        if (!scrollContainerRef.current || !dragDataRef.current) {
            dragDataRef.current = null;
            setDraggingTask(null);
            return;
        }

        const { taskId, startX, startY, startScrollLeft, startScrollTop, startDate, startColleagueId, startColleagueIndex } = dragDataRef.current;

        const totalScrollDelta = scrollContainerRef.current.scrollLeft - startScrollLeft;
        const totalVerticalScrollDelta = scrollContainerRef.current.scrollTop - startScrollTop;
        const pointerDeltaX = e.clientX - startX;
        const pointerDeltaY = e.clientY - startY;

        const totalGridDeltaX = pointerDeltaX + totalScrollDelta;
        const totalVerticalDelta = pointerDeltaY + totalVerticalScrollDelta;

        // NEW: Calculate dayDelta based on variable widths
        let dayDelta = 0;
        let accumulatedWidth = 0;
        const targetDate = new Date(startDate);

        if (totalGridDeltaX > 0) {
            while (accumulatedWidth < totalGridDeltaX) {
                const dayWidth = getColumnWidth(targetDate);
                if (accumulatedWidth + dayWidth / 2 > totalGridDeltaX) break; // Snap logic
                accumulatedWidth += dayWidth;
                targetDate.setDate(targetDate.getDate() + 1);
                dayDelta++;
            }
        } else if (totalGridDeltaX < 0) {
            const tempDate = new Date(startDate);
            while (accumulatedWidth > totalGridDeltaX) {
                tempDate.setDate(tempDate.getDate() - 1);
                const dayWidth = getColumnWidth(tempDate);
                if (accumulatedWidth - dayWidth / 2 < totalGridDeltaX) break; // Snap logic
                accumulatedWidth -= dayWidth;
                dayDelta--;
            }
        }

        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + dayDelta);

        // Only consider colleague change if vertical movement exceeds 40% of row height
        const colleagueDelta = Math.abs(totalVerticalDelta) > (rowHeight * 0.4) ? Math.round(totalVerticalDelta / rowHeight) : 0;
        let newColleagueId = startColleagueId;
        const newIdx = startColleagueIndex + colleagueDelta;
        if (newIdx >= 0 && newIdx < colleagues.length) {
            newColleagueId = colleagues[newIdx].id;
        }

        dragDataRef.current = null;

        if (newColleagueId !== startColleagueId) {
            // Colleague changed - trigger reassign flow
            onReassign(taskId, newColleagueId, newDate);
            setDraggingTask(null);
        } else if (dayDelta !== 0) {
            // Only date changed - implicit update
            onUpdate(taskId, newDate, null);
            // Keep ghost visible briefly to prevent flash while Firestore updates
            setTimeout(() => setDraggingTask(null), 100);
        } else {
            setDraggingTask(null);
        }
    };

    // Hide if this is the dragged task
    const isDragged = draggingTask?.task.id === task.id;


    return (
        <motion.div
            ref={cardRef}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: isDragged ? 0 : 1,
                scale: 1,
                x: left + (getColumnWidth(new Date(currentDate)) / 2) - (cardWidth / 2) + xStackOffset,
                top: "50%",
                y: -46, // Exact half of 92px height for crisp centering
                marginTop: stackOffset,
                width: cardWidth,
                height: 92,
                zIndex: isHovered ? 3000 : 100 - index, // Lane 0 is on TOP (highest z-index)
                originX: 0
            }}
            whileHover={isDragged ? {} : {
                width: hoverWidth,
                zIndex: 3000,
                transition: { duration: 0.15, ease: "easeOut", type: "tween" }
            }}
            transition={{ width: { type: 'tween', duration: 0.15 }, default: { type: 'spring', stiffness: 300, damping: 30 } }}
            className={`absolute pointer-events-auto task-card cursor-grab p-2.5 rounded-2xl border border-slate-900 ${getTaskCardColor(task)} group`}
        >
            <div className="flex flex-col gap-1 relative overflow-hidden min-h-[72px]">
                <div className="absolute -left-1.5 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={10} className="text-slate-400" />
                </div>

                {/* Title - Wrapped */}
                <h4 className="font-black text-slate-900 text-[11px] leading-[1.2] uppercase tracking-tight line-clamp-4 break-words">
                    {task.title}
                </h4>

                {/* Deliverable Icon */}
                <div className="mt-auto pt-1.5 border-t border-slate-900/10 flex items-center justify-center">
                    <Package size={12} className="text-slate-900/50" strokeWidth={2.5} />
                </div>
            </div>
        </motion.div>
    );
};

export default TaskCard;
