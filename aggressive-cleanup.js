import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "ali-manager-local-key",
    authDomain: "ali-manager-local.firebaseapp.com",
    projectId: "ali-manager-local",
    storageBucket: "ali-manager-local.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

async function aggressiveCleanup() {
    console.log("Fetching tasks for aggressive cleanup...");
    const snapshot = await getDocs(collection(db, 'tasks'));
    const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`Total tasks before cleanup: ${tasks.length}`);

    const keptIds = new Set();
    const deleteIds = [];
    const seenKeys = new Set();

    tasks.forEach(task => {
        // Group strictly by Title + Date(Day)
        // We ignore time-of-day differences which caused the dupes
        const dateStr = new Date(task.dueDate).toDateString();
        const key = `${task.title}|${dateStr}`;

        if (seenKeys.has(key)) {
            deleteIds.push(task.id);
        } else {
            seenKeys.add(key);
            keptIds.add(task.id);
        }
    });

    console.log(`Tasks to keep: ${keptIds.size}`);
    console.log(`Tasks to delete: ${deleteIds.length}`);

    if (deleteIds.length > 0) {
        const batch = writeBatch(db);
        deleteIds.forEach(id => {
            batch.delete(doc(db, 'tasks', id));
        });
        await batch.commit();
        console.log("Cleanup complete. Duplicates removed.");
    } else {
        console.log("No duplicates found.");
    }
}

aggressiveCleanup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
