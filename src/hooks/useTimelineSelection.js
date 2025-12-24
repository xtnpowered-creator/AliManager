import { useState, useRef, useCallback, useEffect } from 'react';
import { useTimelineRegistry } from '../context/TimelineRegistryContext';

export const useTimelineSelection = (scrollContainerRef, selectionBoxRef) => {
    const { getTasks } = useTimelineRegistry();
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
    const [isSelectingState, setIsSelectingState] = useState(false); // Only for showing/hiding the box

    // DATA REFS
    const dragRef = useRef({
        isDragging: false,
        isSelecting: false,
        hasMoved: false,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
        startXSelection: 0,
        startYSelection: 0,
        pointerId: null // TRACK POINTER
    });

    // Helper to update the DOM element directly (High Performance)
    const updateSelectionBox = (rect) => {
        if (!selectionBoxRef.current) return;
        const el = selectionBoxRef.current;
        const x = Math.min(rect.x1, rect.x2);
        const y = Math.min(rect.y1, rect.y2);
        const w = Math.abs(rect.x1 - rect.x2);
        const h = Math.abs(rect.y1 - rect.y2);

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
    };

    const handlePointerMove = useCallback((e) => {
        const scrollBox = scrollContainerRef.current;
        if (!scrollBox) return;

        // Verify we are moving the SAME pointer that started the drag
        if (dragRef.current.pointerId !== e.pointerId) return;

        if (dragRef.current.isSelecting) {
            dragRef.current.hasMoved = true;

            const rect = scrollBox.getBoundingClientRect();
            // Pointer coordinates are simple relative math
            const x = e.clientX - rect.left + scrollBox.scrollLeft;
            const y = e.clientY - rect.top + scrollBox.scrollTop;

            const newRect = {
                x1: dragRef.current.startXSelection,
                y1: dragRef.current.startYSelection,
                x2: x,
                y2: y
            };

            // DIRECT DOM UPDATE (No React State)
            updateSelectionBox(newRect);
            dragRef.current.currentRect = newRect; // Store for calculation

        } else if (dragRef.current.isDragging) {
            dragRef.current.hasMoved = true;
            const { startX, startY, scrollLeft, scrollTop, boxLeft, boxTop } = dragRef.current;
            scrollBox.scrollLeft = scrollLeft - (e.pageX - boxLeft - startX);
            scrollBox.scrollTop = scrollTop - (e.pageY - boxTop - startY);
        }
    }, [scrollContainerRef, selectionBoxRef]);

    const cleanupDrag = () => {
        dragRef.current = {
            isDragging: false,
            isSelecting: false,
            hasMoved: false,
            startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0,
            startXSelection: 0, startYSelection: 0,
            pointerId: null,
            currentRect: null
        };
        setIsSelectingState(false);
        if (scrollContainerRef.current) scrollContainerRef.current.classList.remove('cursor-grabbing');
    };

    const handlePointerUp = useCallback((e) => {
        // Only handle OUR pointer
        if (dragRef.current.pointerId !== e.pointerId) return;

        // Release capture
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
            // Ignore if already released
        }

        const { isSelecting, isDragging, hasMoved, currentRect } = dragRef.current;

        if (isSelecting && currentRect) {
            // Calculate Final Selection
            const marqueeTop = Math.min(currentRect.y1, currentRect.y2);
            const marqueeLeft = Math.min(currentRect.x1, currentRect.x2);
            const marqueeRight = Math.max(currentRect.x1, currentRect.x2);
            const marqueeBottom = Math.max(currentRect.y1, currentRect.y2);

            const scrollBox = scrollContainerRef.current;
            const newSelected = new Set();

            if (scrollBox) {
                try {
                    // OPTIMIZED: Use Registry instead of DOM Query
                    const taskMap = getTasks(); // From Registry
                    const scrollBoxRect = scrollBox.getBoundingClientRect();

                    taskMap.forEach((entry, id) => {
                        const el = entry.element;
                        if (!el) return;

                        // We still read rects here, but we skip the heavy querySelectorAll search.
                        // Ideally, entry.rect would be cached, but simple bounding client rect on known elements is fast enough for <1000 items.
                        const elRect = el.getBoundingClientRect();

                        const top = elRect.top - scrollBoxRect.top + scrollBox.scrollTop;
                        const left = elRect.left - scrollBoxRect.left + scrollBox.scrollLeft;
                        const bottom = elRect.bottom - scrollBoxRect.top + scrollBox.scrollTop;
                        const right = elRect.right - scrollBoxRect.left + scrollBox.scrollLeft;

                        const overlap = !(left > marqueeRight || right < marqueeLeft || top > marqueeBottom || bottom < marqueeTop);
                        if (overlap) newSelected.add(id);
                    });

                } catch (err) {
                    console.error("Selection detection failed", err);
                }
            }
            setSelectedTaskIds(newSelected);
        } else if (isDragging) {
            if (!hasMoved) {
                // Click on background -> Clear
                setSelectedTaskIds(new Set());
            }
        }

        cleanupDrag();

    }, [scrollContainerRef]);

    const handlePointerDown = useCallback((e) => {
        if (e.button !== 0) return; // Ignore right click

        // Ignore clicks on tasks/interactive elements
        if (e.target.closest('.no-pan') || e.target.closest('.task-card')) return;

        const scrollBox = scrollContainerRef.current;
        if (!scrollBox) return;

        // CRITICAL: SET POINTER CAPTURE
        try {
            e.target.setPointerCapture(e.pointerId);
        } catch (err) {
            console.error("Failed to capture pointer", err);
            return;
        }

        const rect = scrollBox.getBoundingClientRect();

        if (e.shiftKey) {
            e.preventDefault(); // Prevent text selection
            const x = e.clientX - rect.left + scrollBox.scrollLeft;
            const y = e.clientY - rect.top + scrollBox.scrollTop;

            dragRef.current = {
                isSelecting: true,
                isDragging: false,
                hasMoved: false,
                startXSelection: x,
                startYSelection: y,
                pointerId: e.pointerId, // STORE ID
                currentRect: { x1: x, y1: y, x2: x, y2: y },
                // ... placeholders ...
                startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, boxLeft: 0, boxTop: 0
            };

            setIsSelectingState(true); // Show the box
            requestAnimationFrame(() => updateSelectionBox({ x1: x, y1: y, x2: x, y2: y }));

            setSelectedTaskIds(new Set());

        } else {
            // Pan Start
            dragRef.current = {
                isDragging: true,
                isSelecting: false,
                hasMoved: false,
                pointerId: e.pointerId,
                startX: e.pageX - scrollBox.offsetLeft,
                startY: e.pageY - scrollBox.offsetTop,
                scrollLeft: scrollBox.scrollLeft,
                scrollTop: scrollBox.scrollTop,
                boxLeft: scrollBox.offsetLeft,
                boxTop: scrollBox.offsetTop,
                startXSelection: 0, startYSelection: 0
            };
            scrollBox.classList.add('cursor-grabbing');
        }

    }, [scrollContainerRef, selectionBoxRef]);

    const handlePointerCancel = useCallback((e) => {
        if (dragRef.current.pointerId === e.pointerId) {
            console.warn("Pointer Cancelled!");
            cleanupDrag();
        }
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedTaskIds(new Set());
    }, []);

    return {
        selectedTaskIds,
        setSelectedTaskIds,
        isSelecting: isSelectingState, // Boolean for React Conditional Render
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        handleLostPointerCapture: handlePointerCancel, // Same cleanup
        clearSelection
    };
};
