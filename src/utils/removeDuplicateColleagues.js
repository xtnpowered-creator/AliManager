import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * Remove Duplicate Colleagues Script
 * 
 * PURPOSE:
 * One-time cleanup utility to remove duplicate colleague entries.
 * Uses name-based deduplication (keeps first occurrence, deletes rest).
 * 
 * WHY NEEDED:
 * Early development had race conditions in seeding scripts.
 * Multiple runs created duplicate "John Doe", "Jane Smith" etc.
 * This script cleans up those duplicates.
 * 
 * STRATEGY:
 * - Fetch all colleagues
 * - Build Map of name -> first occurrence ID
 * - Delete all subsequent entries with same name
 * - Log and return count of deleted  duplicates
 * 
 * SAFE TO RUN MULTIPLE TIMES:
 * Idempotent - running again after cleanup does nothing.
 * 
 * @returns {Promise<number>} Count of  deleted duplicates
 */
export const removeDuplicateColleagues = async () => {
    try {
        const colleaguesRef = collection(db, 'colleagues');
        const snapshot = await getDocs(colleaguesRef);

        const colleaguesByName = new Map();
        const duplicates = [];

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const name = data.name;

            if (colleaguesByName.has(name)) {
                // This is a duplicate - mark for deletion
                duplicates.push({
                    id: docSnap.id,
                    name: name
                });
                console.log(`Found duplicate: ${name} (ID: ${docSnap.id})`);
            } else {
                // First occurrence - keep it
                colleaguesByName.set(name, docSnap.id);
            }
        });

        // Delete duplicates
        for (const dup of duplicates) {
            await deleteDoc(doc(db, 'colleagues', dup.id));
            console.log(`Deleted duplicate: ${dup.name} (ID: ${dup.id})`);
        }

        console.log(`Removed ${duplicates.length} duplicate colleague(s)`);
        return duplicates.length;
    } catch (error) {
        console.error('Error removing duplicates:', error);
        throw error;
    }
};
