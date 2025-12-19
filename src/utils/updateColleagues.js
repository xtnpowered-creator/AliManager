import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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
