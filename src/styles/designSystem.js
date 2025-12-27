/**
 * Design System Module
 * 
 * Centralized style constants for consistent UI patterns across the application.
 * Provides reusable Tailwind class sets for cards, buttons, and context menu types.
 * 
 * Purpose:
 * - **DRY principle**: Define styles once, reuse everywhere
 * - **Consistency**: Enforce uniform visual language
 * - **Maintainability**: Single source of truth for design updates
 * - **Type safety**: Named constants prevent typos
 * 
 * Organization:
 * 1. **CARD_VARIANTS**: Visual card styles for different contexts
 * 2. **BUTTON_VARIANTS**: Button styles (primary, secondary, ghost, icon)
 * 3. **CONTEXT_MENU_TYPES**: Right-click menu categories
 * 
 * CARD_VARIANTS Breakdown:
 * - **TIMELINE_DETAILED**: Large dashboard/project cards (formerly MACRO)
 * - **TIMELINE_BUBBLE**: Standard task cards in timeline grid (formerly MICRO)
 * - **TIMELINE_CAPSULE**: Collapsed vertical icon stack (23px wide)
 * - **DAYVIEW_DETAILED**: Dashboard day view task cards (full width/height)
 * - **GHOST**: Empty state placeholders with dashed borders
 * 
 * Naming Convention:
 * - Variants renamed to reflect usage context vs. size
 * - TIMELINE_* prefix for timeline-specific styles
 * - DAYVIEW_* prefix for dashboard day view
 * - Semantic names improve code readability
 * 
 * Usage Pattern:
 * ```jsx
 * import { CARD_VARIANTS } from '../styles/designSystem';
 * <div className={CARD_VARIANTS.TIMELINE_BUBBLE.container}>
 *   <div className={CARD_VARIANTS.TIMELINE_BUBBLE.interactive}>...</div>
 * </div>
 * ```
 * 
 * Component Mapping:
 * - TaskCard.jsx uses TIMELINE_CAPSULE, TIMELINE_BUBBLE, DAYVIEW_DETAILED
 * - Card.jsx uses TIMELINE_DETAILED (macro cards)
 * - ContextMenu.jsx uses CONTEXT_MENU_TYPES for type safety
 * 
 * Design Principles:
 * - Border-first approach (border-slate-900 for clear boundaries)
 * - Rounded corners (rounded-xl, rounded-2xl, rounded-full)
 * - Hover states (ring-2, shadow-md, color transitions)
 * - Color-neutral containers (allow bg color override)
 * 
 * @module designSystem
 */
export const CARD_VARIANTS = {
    // Macro Cards: Dashboard, Projects, Grid Layers
    // Renamed from MACRO to TIMELINE_DETAILED per user request
    TIMELINE_DETAILED: {
        container: "bg-white rounded-2xl border border-slate-900 transition-all duration-200",
        interactive: "hover:ring-2 hover:ring-slate-900 cursor-pointer", // Thicker border on hover
        header: "flex items-center justify-between mb-4",
        title: "text-xl font-bold text-slate-900 tracking-tight",
        subtitle: "text-sm text-slate-500",
    },

    // Micro Cards: Task Cards (Standard View)
    // Renamed from MICRO to TIMELINE_BUBBLE per user request (Standard Task Card)
    TIMELINE_BUBBLE: {
        container: "rounded-xl border border-slate-900 transition-all duration-200", // No bg-white (allows color coding)
        interactive: "hover:ring-2 hover:ring-slate-900 cursor-pointer",
        header: "flex justify-between items-start",
        title: "font-semibold text-slate-900 text-sm leading-tight",
        subtitle: "text-xs text-slate-500",
    },

    // Timeline Capsule (Phase 5)
    TIMELINE_CAPSULE: {
        container: "rounded-full border border-slate-900 w-[23px] h-full flex flex-col items-center justify-center gap-[3px] py-1", // 23px Wide, 3px Gap
        interactive: "hover:ring-2 hover:ring-slate-900 cursor-pointer",
        icon: "w-[14px] h-[14px] rounded-full", // 14px dots
    },

    // Detailed Day View Card (New)
    DAYVIEW_DETAILED: {
        // Same as MICRO but distinct key for semantic clarity and potential future divergence
        container: "rounded-xl border border-slate-900 transition-all duration-200 block w-full h-full",
        interactive: "hover:shadow-md cursor-grab active:cursor-grabbing", // Unique hover (Shadow instead of ring?) User asked for match timeline... 
        // User said: "DetailedTaskDayView tasks have a different default... They should match the timelines in this regard."
        // Timeline Match = hover:ring-2 hover:ring-slate-900.
        // I will align it strictly with MICRO/TIMELINE for now.
        interactive: "hover:ring-2 hover:ring-slate-900 cursor-pointer",
        header: "flex flex-col items-start gap-1",
    },

    // Ghost/Empty Placeholders
    GHOST: {
        container: "border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-center p-8",
        interactive: "hover:border-slate-900 hover:bg-slate-100 transition-colors cursor-pointer",
        title: "text-slate-900 font-bold",
        subtitle: "text-slate-500 text-sm",
    }
};

export const BUTTON_VARIANTS = {
    PRIMARY: "bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/50 flex items-center gap-2",
    SECONDARY: "bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm",
    GHOST: "p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors",
    ICON: "w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
};

// Centralized Context Menu Types
export const CONTEXT_MENU_TYPES = {
    TASK: 'TASK',
    GRID_CELL: 'GRID_CELL',
    PROJECT: 'PROJECT',
    COLLEAGUE: 'COLLEAGUE'
};
