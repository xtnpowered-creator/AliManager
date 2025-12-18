import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Local-only configuration for the emulator suite
const firebaseConfig = {
    apiKey: "ali-manager-local-key",
    authDomain: "ali-manager-local.firebaseapp.com",
    projectId: "ali-manager-local",
    storageBucket: "ali-manager-local.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators in development mode
if (import.meta.env.DEV) {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("Connected to Firebase Emulators");
}

export { auth, db };
export default app;
