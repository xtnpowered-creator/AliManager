import { db } from '../firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

/**
 * Add Vertical Scroll Test Data
 * 
 * PURPOSE:
 * Development utility to test vertical scrolling with many tasks.
 * Creates a test colleague with 8 tasks to verify timeline row overflow behavior.
 * 
 * WHAT IT CREATES:
 * - 1 Colleague: "Vertical Tester" (QA Engineer)
 * - 8 Tasks: Assigned only to this colleague, spread over 3 days
 * - Priority mix: Varies to test priority-based sorting
 * - All lone tasks (no project) to isolate vertical scroll testing
 * 
 * USE CASE:
 * Verify that timelines with 5+ tasks in a single colleague's row:
 * - Display vertical scrollbar (not horizontal overflow)
 * - Maintain proper z-index layering
 * - Don't clip task cards at row boundaries
 * 
 * @returns {Promise<void>}
 */
export const addScrollTestData = async () => {
    try {
        console.log("Adding vertical scroll test data...");

        // 1. Add Test Colleague
        const colleagueRef = doc(collection(db, 'colleagues'));
        const colleagueId = colleagueRef.id;
        await setDoc(colleagueRef, {
            name: 'Vertical Tester',
            role: 'QA Engineer',
            avatar: 'VT'
        });

        // 2. Add Lone Tasks (Assigned only to this new colleague)
        const tasks = Array.from({ length: 8 }).map((_, i) => ({
            title: `Vertical Scroll Task ${i + 1}`,
            projectId: null, // Lone task
            assignedTo: [colleagueId],
            dueDate: new Date(Date.now() + 86400000 * (i % 3)).toISOString(), // Spread over 3 days
            status: 'todo',
            priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
        }));

        for (const task of tasks) {
            await addDoc(collection(db, 'tasks'), task);
        }

        console.log("Test data added successfully!");
        alert("Added 'Vertical Tester' and 8 tasks!");
    } catch (error) {
        console.error("Error adding test data:", error);
        alert("Error adding data. Check console.");
    }
};
