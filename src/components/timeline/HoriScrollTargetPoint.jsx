import React, { useRef, useState, useEffect } from 'react';

/**
 * HoriScrollTargetPoint Component
 * 
 * Draggable red triangle indicator that marks the timeline scroll anchor position.
 * User can drag the triangle left/right to customize where dates align during scroll operations.
 * 
 * Purpose:
 * - Visual marker for scroll alignment point (where "today" or target dates center)
 * - Draggable to customize timeline navigation experience
 * - Position saved to localStorage via parent's onDrag callback
 * 
 * Performance Optimization:
 * - Uses direct DOM manipulation during drag (bypasses React render cycle)
 * - Updates happen via elementRef.current.style.left (no state changes mid-drag)
 * - Only commits to parent state on drag end
 * - willChange: 'left' hints to browser compositor for smooth animation
 * 
 * Pointer Capture:
 * - setPointerCapture ensures drag continues even if cursor leaves element
 * - Critical for smooth drag experience
 * 
 * Constraints:
 * - minX: Minimum allowed position (prevents dragging into sidebar)
 * - maxX: Static maximum (if provided)
 * - rightBuffer: Dynamic max based on container width (prevents dragging off-screen)
 * - Final constraint = min(maxX, containerWidth - rightBuffer)
 * 
 * Visual Elements:
 * - Invisible hit area (wider than visual for easier grabbing)
 * - Red triangle (16px tall, 22px wide at base)
 * - Drop shadow when dragging (visual feedback)
 * - ew-resize cursor (indicates horizontal drag)
 * 
 * @param {Object} props
 * @param {number} props.positionX - Current X position in pixels
 * @param {Function} props.onDrag - Callback when drag completes (newX)
 * @param {number} [props.minX] - Minimum allowed X position
 * @param {number} [props.maxX] - Maximum allowed X position (static)
 * @param {React.RefObject} [props.containerRef] - Container ref for dynamic max calculation
 * @param {number} [props.rightBuffer=50] - Pixels from right edge for dynamic max
 */
const HoriScrollTargetPoint = ({ positionX, onDrag, minX, maxX, containerRef, rightBuffer = 50 }) => {
    const [isDragging, setIsDragging] = useState(false);

    // Direct DOM ref for zero-latency updates during drag
    const elementRef = useRef(null);

    // Mutable refs to track state without re-renders
    const currentXRef = useRef(positionX);
    const startXRef = useRef(0);        // Initial pointer X when drag starts
    const startPosXRef = useRef(0);     // Initial element position when drag starts

    // Sync DOM when prop changes (external updates) ONLY if not dragging
    // Prevents jank from external updates interrupting user drag
    useEffect(() => {
        if (!isDragging && elementRef.current) {
            currentXRef.current = positionX;
            elementRef.current.style.left = `${positionX}px`;
        }
    }, [positionX, isDragging]);

    const handlePointerDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        startXRef.current = e.clientX;
        startPosXRef.current = currentXRef.current;
        e.currentTarget.setPointerCapture(e.pointerId); // Capture pointer for smooth drag
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        // Calculate new position based on pointer movement
        const dx = e.clientX - startXRef.current;
        let newX = startPosXRef.current + dx;

        // Dynamic max limit based on container width
        let limitMax = maxX;
        if (containerRef && containerRef.current) {
            const dynamicMax = containerRef.current.clientWidth - rightBuffer;
            // Use tighter constraint if both maxX and dynamicMax exist
            limitMax = (maxX !== undefined) ? Math.min(maxX, dynamicMax) : dynamicMax;
        }

        // Clamp to constraints
        if (minX !== undefined) newX = Math.max(minX, newX);
        if (limitMax !== undefined) newX = Math.min(limitMax, newX);

        // DIRECT DOM UPDATE - No React Render Cycle (performance optimization)
        if (elementRef.current) {
            elementRef.current.style.left = `${newX}px`;
        }
        currentXRef.current = newX;
    };

    const handlePointerUp = (e) => {
        if (isDragging) {
            setIsDragging(false);
            e.currentTarget.releasePointerCapture(e.pointerId);
            // Commit final position to parent (triggers localStorage save)
            onDrag(currentXRef.current);
        }
    };

    return (
        <div
            ref={elementRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
                position: 'absolute',
                left: `${positionX}px`,  // Initial render position
                top: 0,
                zIndex: 601,             // Above everything else
                transform: 'translateX(-50%)',  // Center triangle on position
                cursor: 'ew-resize',     // Horizontal resize cursor
                touchAction: 'none',     // Prevents scrolling on touch devices
                willChange: 'left'       // Hint to compositor for smooth animation
            }}
            className="group"
            title="Drag to adjust scroll target"
        >
            {/* Invisible hit area (larger than visual for easier grabbing) */}
            <div className="absolute -left-3 -top-1 w-6 h-8 bg-transparent" />

            {/* Visual Indicator: Red triangle pointing down */}
            <div
                style={{
                    width: 0,
                    height: 0,
                    borderLeft: '11px solid transparent',
                    borderRight: '11px solid transparent',
                    borderTop: '16px solid red',
                    filter: isDragging ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' : 'none',
                    transition: 'filter 0.1s ease'
                }}
            />
        </div>
    );
};

export default HoriScrollTargetPoint;
