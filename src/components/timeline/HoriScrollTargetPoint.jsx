import React, { useRef, useState, useEffect } from 'react';

const HoriScrollTargetPoint = ({ positionX, onDrag, minX, maxX }) => {
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const startPosXRef = useRef(0);

    const handlePointerDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        startXRef.current = e.clientX;
        startPosXRef.current = positionX;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const dx = e.clientX - startXRef.current;
        let newX = startPosXRef.current + dx;

        // Clamp
        if (minX !== undefined) newX = Math.max(minX, newX);
        if (maxX !== undefined) newX = Math.min(maxX, newX);

        onDrag(newX);
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
                position: 'absolute',
                left: `${positionX}px`,
                top: 0,
                zIndex: 601, // Above everything
                transform: 'translateX(-50%)',
                cursor: 'ew-resize',
                touchAction: 'none'
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
