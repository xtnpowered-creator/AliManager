import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function checkTasks() {
    console.log("Fetching tasks to count...");
    const snapshot = await getDocs(collection(db, 'tasks'));
    console.log(`Current Total Tasks: ${snapshot.size}`);

    // Check for duplicates
    const tasks = snapshot.docs.map(d => d.data());
    const seen = new Set();
    let duplicates = 0;

    tasks.forEach(t => {
        const key = `${t.title}|${t.dueDate}|${(t.assignedTo || []).join(',')}`;
        if (seen.has(key)) duplicates++;
        seen.add(key);
    });

    console.log(`Duplicate Tasks: ${duplicates}`);
    console.log(`Unique Tasks: ${tasks.length - duplicates}`);
}

checkTasks().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
