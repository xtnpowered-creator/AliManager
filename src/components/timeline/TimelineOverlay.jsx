import React from 'react';
import TimelineControls from '../TimelineControls';

const TimelineOverlay = ({
    selectionBoxRef,
    isSelecting,
    showSidebar,
    onTodayClick,
    scale
}) => {
    return (
        <>
            {/* TODAY OVERLAY BUTTON (If Sidebar Hidden) */}
            {!showSidebar && (
                <div className="absolute top-4 right-6 z-[160] pointer-events-auto">
                    <TimelineControls
                        onTodayClick={onTodayClick}
                        scale={scale}
                    />
                </div>
            )}

            {/* Selection Marquee */}
            <div ref={selectionBoxRef} style={{
                display: isSelecting ? 'block' : 'none',
                position: 'absolute',
                left: 0, top: 0, width: 0, height: 0,
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                border: '1px solid #14b8a6',
                zIndex: 99999, pointerEvents: 'none', borderRadius: '4px',
                transform: 'translateZ(9999px)', willChange: 'left, top, width, height'
            }} />
        </>
    );
};

export default TimelineOverlay;
