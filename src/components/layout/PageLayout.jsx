import React from 'react';

// -- SOURCE OF TRUTH FOR LAYOUT DIMENSIONS -- //
export const LAYOUT_DIMENSIONS = {
    // Title Area
    TITLE_PT: 'pt-5',     // Top padding for the entire view
    TITLE_PB: 'pb-0',     // visual gap between title and controls (Zeroed for tightness)
    HEADER_HEIGHT: 'h-[50px]', // Reserved height for visual consistency if needed, or allow auto

    // Controls Area (Filters/Toolbars)
    CONTROLS_PB: 'pb-1.5',  // Gap between controls and content (Matches perfecected layout)
    CONTROLS_MIN_H: 'min-h-[42px]', // Reserve space if needed? Or allow collapse? 
    // User said "gap in which controls can sit". 
    // Let's rely on padding for the gap.

    // Content Area
    CONTENT_PX: 'px-8',
    CONTENT_PB: 'pb-8',
};

const PageLayout = ({
    title,
    subtitle,
    actions,           // Top-right buttons (e.g. Timeline Controls)
    filters,           // The Filter/Sort Toolbar
    children,          // The Main Content (Timeline, Grid, etc)
    className = ""
}) => {
    return (
        <div className={`h-full flex flex-col overflow-hidden select-none bg-transparent ${className}`}>

            {/* 1. TITLE & ACTIONS SPACE */}
            {/* 1. TITLE & ACTIONS SPACE */}
            <header className={`${LAYOUT_DIMENSIONS.TITLE_PT} ${LAYOUT_DIMENSIONS.TITLE_PB} px-8 shrink-0 flex items-end justify-between gap-4 z-40 relative pointer-events-none`}>
                {/* Title Block */}
                <div className="flex flex-col justify-end pointer-events-auto">
                    {/* Optional: We could enforce fixed height here for alignment using h-[XX] */}
                    <div className="flex items-baseline gap-4">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{title}</h2>
                        {subtitle && <p className="text-slate-500 text-lg leading-none">{subtitle}</p>}
                    </div>
                </div>

                {/* Actions Block (Buttons) - Aligned to Bottom of Title line */}
                <div className="pointer-events-auto"> {/* Tiny adjustment to align buttons with text baseline if needed */}
                    {actions}
                </div>
            </header>

            {/* 2. CONTROLS SPACE (Filters) */}
            <div className={`px-8 ${LAYOUT_DIMENSIONS.CONTROLS_PB} shrink-0 flex flex-col justify-end -mt-5 relative z-[100]`}>
                {/* 
                    This wrapper ensures that even if 'filters' is null, we MIGHT want to preserve space?
                    User said: "limit line... and space below it, will be content space".
                    If we want Content to ALWAYS start at Y=150px, we need fixed heights above.
                    Currently, Flex usage pushes content down based on presence.
                    To STRICTLY enforce "Content never starts above X", we can use `min-h` on the header+controls combo 
                    or `mt-[TotalOffset]`.
                    
                    For now, I will assume "Structure" simply means "Consistent Margins".
                */}
                {filters}
            </div>

            {/* 3. CONTENT SPACE */}
            <main className={`${LAYOUT_DIMENSIONS.CONTENT_PX} ${LAYOUT_DIMENSIONS.CONTENT_PB} flex-1 overflow-hidden relative flex flex-col z-0`}>
                {/* The Top Edge of THIS div is the "Limit Line" the user cares about. */}
                {children}
            </main>

        </div>
    );
};

export default PageLayout;
