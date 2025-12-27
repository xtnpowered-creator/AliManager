import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Update Colleague Details - Data Migration Script
 * 
 * PURPOSE:
 * One-time migration to add company/department fields to existing colleagues.
 * Updates records that were created before these fields existed in schema.
 * 
 * WHAT IT UPDATES:
 * - Adds `company: "Mattamay Homes"` to all colleagues
 * - Adds department-specific info (Purchasing, Engineering, Design, Marketing)
 * - Normalizes role titles and avatar initials
 * 
 * MATCHING STRATEGY:
 * Fuzzy match by name (handles "Alisara" vs "Alisara Plyler").
 * Uses includes() for flexible matching.
 * 
 * WHEN TO RUN:
 * - After initial database creation
 * - When adding new required fields to colleague schema
 * - One-time only (don't run repeatedly)
 * 
 * @returns {Promise<void>}
 */
// Helper function to update colleague data with company/department info
export const updateColleagueDetails = async () => {
    try {
        const colleaguesSnapshot = await getDocs(collection(db, 'colleagues'));

        const updates = {
            'Alisara': {
                name: 'Alisara Plyler',
                role: 'Purchasing Director',
                company: 'Mattamay Homes',
                department: 'Purchasing',
                avatar: 'AP'
            },
            'John Doe': {
                role: 'Senior Developer',
                company: 'Mattamay Homes',
                department: 'Engineering'
            },
            'Jane Smith': {
                role: 'Lead Designer',
                company: 'Mattamay Homes',
                department: 'Design'
            },
            'Sam Wilson': {
                role: 'Marketing Director',
                company: 'Mattamay Homes',
                department: 'Marketing'
            }
        };

        for (const docSnap of colleaguesSnapshot.docs) {
            const data = docSnap.data();
            const currentName = data.name;

            // Find matching update
            const updateData = Object.entries(updates).find(([key]) =>
                currentName.includes(key) || key.includes(currentName)
            )?.[1];

            if (updateData) {
                await updateDoc(doc(db, 'colleagues', docSnap.id), updateData);
                console.log(`Updated ${currentName} with new details`);
            }
        }

        console.log('All colleagues updated successfully!');
    } catch (error) {
        console.error('Error updating colleagues:', error);
    }
};
