import React, { createContext, useContext, useRef, useCallback } from 'react';

/**
 * TimelineRegistryContext Module
 * 
 * Maintains a registry of all rendered task card DOM elements for efficient lookup.
 * Used by useTimelineSelection for marquee selection without querySelectorAll.
 * 
 * Purpose:
 * - Avoids expensive DOM queries (querySelectorAll('.task-card'))
 * - Provides O(1) access to task elements by ID
 * - Enables selection collision detection without full DOM traversal
 * 
 * Performance Benefit:
 * - Traditional approach: querySelectorAll on every selection (100+ elements)
 * - Registry approach: Direct Map lookup (instant, no DOM query)
 * - Crucial for smooth marquee selection with many tasks
 * 
 * Registration Pattern:
 * - Each TaskCard registers itself on mount via useEffect
 * - Unregisters on unmount (cleanup)
 * - Map stored in ref (updates don't trigger provider re-renders)
 * 
 * Registry Structure:
 * ```js
 * Map {
 *   "task-uuid-1" => { id: "task-uuid-1", element: <div.task-card> },
 *   "task-uuid-2" => { id: "task-uuid-2", element: <div.task-card> },
 *   ...
 * }
 * ```
 * 
 * Usage in TaskCard:
 * ```js
 * const { registerTask, unregisterTask } = useTimelineRegistry();
 * 
 * useEffect(() => {
 *   if (cardRef.current && task.id) {
 *     registerTask(task.id, cardRef.current);
 *   }
 *   return () => unregisterTask(task.id);
 * }, [task.id]);
 * ```
 * 
 * Usage in Selection:
 * ```js
 * const { getTasks } = useTimelineRegistry();
 * const taskMap = getTasks(); // Get all registered tasks
 * 
 * taskMap.forEach((entry, id) => {
 *   const rect = entry.element.getBoundingClientRect();
 *   // Check collision with selection box
 * });
 * ```
 * 
 * @module TimelineRegistryContext
 */

const TimelineRegistryContext = createContext(null);

export const TimelineRegistryProvider = ({ children }) => {
    // Map of task ID -> { id, element }
    // Uses ref to avoid provider re-renders on registration
    const registryRef = useRef(new Map());

    /**
     * Register a task card element
     * @param {string} id - Task ID
     * @param {HTMLElement} element - Task card DOM element
     */
    const registerTask = useCallback((id, element) => {
        if (!id || !element) return;

        // Store element reference for later collision detection
        // Rect calculation deferred until selection time (lazy evaluation)
        registryRef.current.set(id, { id, element });
    }, []);

    /**
     * Unregister a task card (cleanup on unmount)
     * @param {string} id - Task ID to remove
     */
    const unregisterTask = useCallback((id) => {
        registryRef.current.delete(id);
    }, []);

    /**
     * Get all registered task elements
     * @returns {Map} Map of task ID -> { id, element }
     */
    const getTasks = useCallback(() => {
        return registryRef.current;
    }, []);

    return (
        <TimelineRegistryContext.Provider value={{ registerTask, unregisterTask, getTasks }}>
            {children}
        </TimelineRegistryContext.Provider>
    );
};

/**
 * Hook to access TimelineRegistryContext
 * Throws error if used outside TimelineRegistryProvider
 */
export const useTimelineRegistry = () => {
    const context = useContext(TimelineRegistryContext);
    if (!context) {
        throw new Error('useTimelineRegistry must be used within a TimelineRegistryProvider');
    }
    return context;
};
