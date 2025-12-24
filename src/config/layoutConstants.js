/**
 * Centralized configuration for Timeline layout dimensions.
 * These constants control the synchronization between the visual layout (CSS) and 
 * the programmatic scrolling/positioning logic.
 */
export const TIMELINE_LAYOUT = {
    // The horizontal pixel position where "Today" or target dates should align.
    // Visually marked by the red triangle arrow.
    // Future-proofing: This can be converted to state for a user-draggable anchor.
    SCROLL_ANCHOR_X: 350,

    // The vertical pixel offset to align content below the sticky header.
    // Adjust this if the header height changes.
    SCROLL_ANCHOR_Y: 180,
};
