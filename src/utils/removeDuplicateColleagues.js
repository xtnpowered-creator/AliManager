import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
