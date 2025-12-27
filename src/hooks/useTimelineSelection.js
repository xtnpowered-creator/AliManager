import { useState, useRef, useCallback } from 'react';
import { useTimelineRegistry } from '../context/TimelineRegistryContext';

/**
 * useTimelineSelection Hook
 * 
 * Implements multi-select via marquee (Shift+Drag) and pan-to-scroll for timeline views.
 * Uses Pointer Events API for robust cross-device support (mouse, touch, pen).
 * 
 * Modes:
 * 1. **Pan Mode** (Default): Click-drag on grid background scrolls the view
 * 2. **Marquee Selection** (Shift+Drag): Creates selection box, highlights overlapping tasks
 * 
 * Performance Optimizations:
 * - Direct DOM manipulation for selection box (bypasses React re-renders)
 * - Uses TimelineRegistry to lookup tasks without querySelectorAll
 * - Pointer capture prevents lost events when cursor leaves viewport
 * 
 * Pointer Capture:
 * Why: Ensures pointer events continue even when cursor moves outside browser window
 * Critical for drag operations that might exit viewport
 * 
 * State Management:
 * - dragRef: Ref object tracking drag state (avoids re-renders on every pixel moved)
 * - isSelectingState: Boolean state to show/hide selection box (React state for render)
 * - selectedTaskIds: Set of selected task IDs (React state, passed to consumers)
 * 
 * Collision Detection:
 * - Uses AABB (Axis-Aligned Bounding Box) overlap test
 * - Formula: !(left > marqueeRight || right < marqueeLeft || top > marqueeBottom || bottom < marqueeTop)
 * - Accounts for scroll position by adding scrollLeft/scrollTop
 * 
 * @param {React.RefObject} scrollContainerRef - Ref to scrollable container
 * @param {React.RefObject} selectionBoxRef - Ref to selection box DOM element
 * @returns {Object} Selection state and event handlers
 */
export const useTimelineSelection = (scrollContainerRef, selectionBoxRef) => {
    const { getTasks } = useTimelineRegistry(); // Optimized task lookup
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
    const [isSelectingState, setIsSelectingState] = useState(false); // Controls box visibility

    // DATA REFS (Avoids re-renders during drag)
    const dragRef = useRef({
        isDragging: false,      // Pan mode active
        isSelecting: false,     // Marquee mode active
        hasMoved: false,        // Distinguishes click from drag
        startX: 0,              // Pan: Initial cursor X
        startY: 0,              // Pan: Initial cursor Y
        scrollLeft: 0,          // Pan: Initial scroll position
        scrollTop: 0,           // Pan: Initial scroll position
        startXSelection: 0,     // Marquee: Start corner X (accounting for scroll)
        startYSelection: 0,     // Marquee: Start corner Y (accounting for scroll)
        pointerId: null         // Tracks which pointer started the drag
    });

    /**
     * Helper: Updates selection box DOM directly (high performance)
     * Bypasses React state to avoid re-renders on every pixel moved
     */
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
            // Marquee Mode: Update selection box
            dragRef.current.hasMoved = true;

            const rect = scrollBox.getBoundingClientRect();
            // Calculate pointer position accounting for scroll
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
            dragRef.current.currentRect = newRect; // Store for final calculation

        } else if (dragRef.current.isDragging) {
            // Pan Mode: Update scroll position
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

        // Release pointer capture
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
            // Ignore if already released
        }

        const { isSelecting, isDragging, hasMoved, currentRect } = dragRef.current;

        if (isSelecting && currentRect) {
            // Calculate Final Selection via AABB overlap test
            const marqueeTop = Math.min(currentRect.y1, currentRect.y2);
            const marqueeLeft = Math.min(currentRect.x1, currentRect.x2);
            const marqueeRight = Math.max(currentRect.x1, currentRect.x2);
            const marqueeBottom = Math.max(currentRect.y1, currentRect.y2);

            const scrollBox = scrollContainerRef.current;
            const newSelected = new Set();

            if (scrollBox) {
                try {
                    // OPTIMIZED: Use Registry instead of DOM Query
                    const taskMap = getTasks(); // From Registry (no querySelectorAll)
                    const scrollBoxRect = scrollBox.getBoundingClientRect();

                    taskMap.forEach((entry, id) => {
                        const el = entry.element;
                        if (!el) return;

                        // Get task card bounding box
                        const elRect = el.getBoundingClientRect();

                        // Convert to scroll-space coordinates
                        const top = elRect.top - scrollBoxRect.top + scrollBox.scrollTop;
                        const left = elRect.left - scrollBoxRect.left + scrollBox.scrollLeft;
                        const bottom = elRect.bottom - scrollBoxRect.top + scrollBox.scrollTop;
                        const right = elRect.right - scrollBoxRect.left + scrollBox.scrollLeft;

                        // AABB Overlap Test
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
                // Click on background without drag → Clear selection
                setSelectedTaskIds(new Set());
            }
        }

        cleanupDrag();

    }, [scrollContainerRef, getTasks]);

    const handlePointerDown = useCallback((e) => {
        if (e.button !== 0) return; // Ignore right click

        // Ignore clicks on tasks/interactive elements
        if (e.target.closest('.no-pan') || e.target.closest('.task-card')) return;

        const scrollBox = scrollContainerRef.current;
        if (!scrollBox) return;

        // CRITICAL: SET POINTER CAPTURE
        // Ensures events continue even if cursor leaves viewport
        try {
            e.target.setPointerCapture(e.pointerId);
        } catch (err) {
            console.error("Failed to capture pointer", err);
            return;
        }

        const rect = scrollBox.getBoundingClientRect();

        if (e.shiftKey) {
            // Marquee Selection Mode
            e.preventDefault(); // Prevent text selection
            const x = e.clientX - rect.left + scrollBox.scrollLeft;
            const y = e.clientY - rect.top + scrollBox.scrollTop;

            dragRef.current = {
                isSelecting: true,
                isDragging: false,
                hasMoved: false,
                startXSelection: x,
                startYSelection: y,
                pointerId: e.pointerId, // Track pointer ID
                currentRect: { x1: x, y1: y, x2: x, y2: y },
                // Unused in selection mode, but must exist
                startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, boxLeft: 0, boxTop: 0
            };

            setIsSelectingState(true); // Show the box
            requestAnimationFrame(() => updateSelectionBox({ x1: x, y1: y, x2: x, y2: y }));

            // Clear existing selection when starting new marquee
            setSelectedTaskIds(new Set());

        } else {
            // Pan Mode
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
                // Unused in pan mode
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
        isSelecting: isSelectingState, // Boolean for React conditional render
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        handleLostPointerCapture: handlePointerCancel, // Same cleanup
        clearSelection
    };
};
