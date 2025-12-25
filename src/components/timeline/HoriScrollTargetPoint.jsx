import React, { useRef, useState, useEffect } from 'react';

const HoriScrollTargetPoint = ({ positionX, onDrag, minX, maxX, containerRef, rightBuffer = 50 }) => {
    const [isDragging, setIsDragging] = useState(false);

    // Direct DOM ref for zero-latency updates
    const elementRef = useRef(null);

    // Mutable refs to track state without re-renders during drag
    const currentXRef = useRef(positionX);
    const startXRef = useRef(0);
    const startPosXRef = useRef(0);

    // Sync DOM when prop changes (external updates) ONLY if not dragging
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
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const dx = e.clientX - startXRef.current;
        let newX = startPosXRef.current + dx;

        // Dynamic Max Limit based on Container
        let limitMax = maxX;
        if (containerRef && containerRef.current) {
            const dynamicMax = containerRef.current.clientWidth - rightBuffer;
            // If maxX is also provided, take the tighter constraint (min of both)
            limitMax = (maxX !== undefined) ? Math.min(maxX, dynamicMax) : dynamicMax;
        }

        // Clamp
        if (minX !== undefined) newX = Math.max(minX, newX);
        if (limitMax !== undefined) newX = Math.min(limitMax, newX);

        // DIRECT DOM UPDATE - No React Render Cycle
        if (elementRef.current) {
            elementRef.current.style.left = `${newX}px`;
        }
        currentXRef.current = newX;
    };

    const handlePointerUp = (e) => {
        if (isDragging) {
            setIsDragging(false);
            e.currentTarget.releasePointerCapture(e.pointerId);
            // Commit final position to parent
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
                // Initial render position (subsequent updates via ref)
                left: `${positionX}px`,
                top: 0,
                zIndex: 601, // Above everything
                transform: 'translateX(-50%)',
                cursor: 'ew-resize',
                touchAction: 'none',
                willChange: 'left' // Hint to browser compositor
            }}
            className="group"
            title="Drag to adjust scroll target"
        >
            {/* Hit Area (Invisible but larger) */}
            <div className="absolute -left-3 -top-1 w-6 h-8 bg-transparent" />

            {/* Visual Indicator (The Red Triangle) */}
            <div
                style={{
                    width: 0,
                    height: 0,
                    borderLeft: '11px solid transparent',
                    borderRight: '11px solid transparent',
                    borderTop: '16px solid red', // Slightly larger for visibility
                    filter: isDragging ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' : 'none',
                    transition: 'filter 0.1s ease'
                }}
            />
        </div>
    );
};

export default HoriScrollTargetPoint;
