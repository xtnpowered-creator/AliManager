import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, GripVertical } from 'lucide-react';

const TaskCard = ({ task, index, currentDate, currentColleagueId, colleagues, colleagueIndex, getColumnWidth, onUpdate, setScrollDirection, scrollContainerRef, draggingTask, setDraggingTask, ghostRef, onReassign }) => {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    const xOffset = index * 12;
    const yOffset = index * -12;
    const rowHeight = 192;
    const personnelColWidth = 224;

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
            offsetY
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

        const { taskId, startX, startY, startScrollLeft, startDate, startColleagueId, startColleagueIndex } = dragDataRef.current;
        // Calculate movement
        const totalScrollDelta = scrollContainerRef.current.scrollLeft - startScrollLeft;
        const pointerDeltaX = e.clientX - startX;
        const pointerDeltaY = e.clientY - startY;

        const totalGridDeltaX = pointerDeltaX + totalScrollDelta;

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

        const colleagueDelta = Math.round(pointerDeltaY / rowHeight);
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
                x: xOffset,
                y: yOffset,
                width: getColumnWidth(currentDate) - 4, // Leave a tiny gap
                zIndex: isHovered ? 1000 : 10 + index
            }}
            whileHover={{
                scale: 1.25,
                transition: { duration: 0.2 }
            }}
            className={`absolute pointer-events-auto task-card cursor-grab p-3 rounded-xl border-[2.5px] border-slate-900 shadow-[6px_6px_0_0_rgba(0,0,0,1)] ${task.priority === 'high' ? 'bg-amber-100' :
                task.priority === 'medium' ? 'bg-blue-100' : 'bg-teal-100'
                } group transition-all`}
        >
            <div className="flex flex-col gap-2 relative">
                <div className="absolute -left-1.5 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={12} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-1.5 font-black text-[8px] uppercase tracking-[0.1em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    {task.priority || 'Task'}
                </div>
                <h4 className="font-black text-slate-900 text-[10px] leading-tight uppercase tracking-tight line-clamp-2">{task.title}</h4>
                <div className="flex items-center justify-between mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-900" />
                        <span className="text-[8px] font-black text-slate-900 uppercase">Deliverable</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TaskCard;
