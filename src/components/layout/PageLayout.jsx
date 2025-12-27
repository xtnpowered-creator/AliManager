import React from 'react';

/**
 * PageLayout Component
 * 
 * Standardized layout wrapper for all major views (Timelines, Kanban, etc.).
 * Provides consistent spacing, title positioning, and content structure.
 * 
 * Layout Structure (3 areas):
 * 
 * 1. **Title & Actions Area** (header):
 *    - Page title + subtitle on left
 *    - Action buttons on right (e.g., "+ New Task", filters toggle)
 *    - Baseline-aligned for visual harmony
 *    - Fixed top padding (pt-5), no bottom padding (tight)
 * 
 * 2. **Controls Area** (filters):
 *    - Filter/sort toolbars
 *    - Positioned just below title, negative margin for tightness
 *    - Collapses when no filters provided
 *    - z-index 100 (above content to prevent overlap)
 * 
 * 3. **Content Area** (main):
 *    - Primary view content (timeline grid, kanban board, etc.)
 *    - flex-1 (fills remaining vertical space)
 *    - overflow-hidden (children manage their own scrolling)
 *    - Horizontal padding + bottom padding for breathing room
 * 
 * Dimension Constants (LAYOUT_DIMENSIONS):
 * - Exported for reuse in other components
 * - Single source of truth for spacing consistency
 * - Allows global layout adjustments from one location
 * 
 * Pointer Events Optimization:
 * - Header has pointer-events-none (pass-through)
 * - Child elements have pointer-events-auto (receive clicks)
 * - Allows clicking content behind header when header is "empty space"
 * 
 * Z-Index Layering:
 * - header: z-40 (above content)
 * - controls: z-100 (above everything, sticky filters)
 * - main: z-0 (base layer)
 * 
 * @param {Object} props
 * @param {string} props.title - Page title text
 * @param {string} [props.subtitle] - Optional subtitle/description
 * @param {ReactNode} [props.actions] - Action buttons (top-right)
 * @param {ReactNode} [props.filters] - Filter/sort controls
 * @param {ReactNode} props.children - Main content
 * @param {string} [props.className=''] - Additional CSS classes
 */

// Source of truth for layout spacing constants
export const LAYOUT_DIMENSIONS = {
    // Title Area
    TITLE_PT: 'pt-5',           // Top padding for entire view
    TITLE_PB: 'pb-0',           // No gap below title (tight layout)
    HEADER_HEIGHT: 'h-[50px]',  // Reserved height for consistency

    // Controls Area (Filters/Toolbars)
    CONTROLS_PB: 'pb-1.5',      // Gap between controls and content
    CONTROLS_MIN_H: 'min-h-[42px]', // Minimum height for controls area

    // Content Area
    CONTENT_PX: 'px-8',         // Horizontal padding
    CONTENT_PB: 'pb-8',         // Bottom padding
};

const PageLayout = ({
    title,
    subtitle,
    actions,      // Top-right buttons
    filters,      // Filter/sort toolbar
    children,     // Main content
    className = ""
}) => {
    return (
        <div className={`h-full flex flex-col overflow-hidden select-none bg-transparent ${className}`}>

            {/* 1. TITLE & ACTIONS AREA */}
            <header className={`${LAYOUT_DIMENSIONS.TITLE_PT} ${LAYOUT_DIMENSIONS.TITLE_PB} px-8 shrink-0 flex items-end justify-between gap-4 z-40 relative pointer-events-none`}>
                {/* Title Block (left) */}
                <div className="flex flex-col justify-end pointer-events-auto">
                    <div className="flex items-baseline gap-4">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{title}</h2>
                        {subtitle && <p className="text-slate-500 text-lg leading-none">{subtitle}</p>}
                    </div>
                </div>

                {/* Actions Block (right) - Aligned to title baseline */}
                <div className="pointer-events-auto">
                    {actions}
                </div>
            </header>

            {/* 2. CONTROLS AREA (Filters) */}
            <div className={`px-8 ${LAYOUT_DIMENSIONS.CONTROLS_PB} shrink-0 flex flex-col justify-end -mt-5 relative z-[100]`}>
                {filters}
            </div>

            {/* 3. CONTENT AREA */}
            <main className={`${LAYOUT_DIMENSIONS.CONTENT_PX} ${LAYOUT_DIMENSIONS.CONTENT_PB} flex-1 overflow-hidden relative flex flex-col z-0`}>
                {/* Top edge of this div is the "limit line" for content */}
                {children}
            </main>

        </div>
    );
};

export default PageLayout;
