import React from 'react';

// -- SOURCE OF TRUTH FOR LAYOUT DIMENSIONS -- //
export const LAYOUT_DIMENSIONS = {
    // Title Area
    TITLE_PT: 'pt-5',     // Top padding for the entire view
    TITLE_PB: 'pb-6',     // Consistent gap below the title and actions

    // Controls Area (Filters/Toolbars)
    CONTROLS_PB: 'pb-1.5',  // Gap between controls and content (Shared toolbar spacing)

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

            <header className={`${LAYOUT_DIMENSIONS.TITLE_PT} ${LAYOUT_DIMENSIONS.TITLE_PB} px-8 shrink-0 flex items-end justify-between gap-4 z-40 relative pointer-events-none`}>
                <div className="flex flex-col justify-end pointer-events-auto">
                    <div className="flex gap-4" style={{ alignItems: 'last baseline' }}>
                        <h2 className="text-3xl font-bold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                        {subtitle && <p className="text-lg leading-none" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
                    </div>
                </div>

                <div className="pointer-events-auto">
                    {actions}
                </div>
            </header>

            {filters && <div className={`px-8 ${LAYOUT_DIMENSIONS.CONTROLS_PB} shrink-0 flex flex-col justify-end relative z-[100]`}>
                {filters}
            </div>}

            <main className={`${LAYOUT_DIMENSIONS.CONTENT_PX} ${LAYOUT_DIMENSIONS.CONTENT_PB} flex-1 overflow-hidden relative flex flex-col z-0`}>
                {children}
            </main>

        </div>
    );
};

export default PageLayout;
