import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// --- PRODUCTION CONFIG ---
// TO DO: Replace these values with your actual keys from the Firebase Console!
// (Settings -> Project Settings -> General -> Your Apps)
const prodConfig = {
    apiKey: "REPLACE_WITH_YOUR_API_KEY",
    authDomain: "alimanager.firebaseapp.com",
    projectId: "alimanager",
    storageBucket: "alimanager.appspot.com",
    messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
    appId: "REPLACE_WITH_YOUR_APP_ID"
};

// --- EMULATOR CONFIG ---
const emulatorConfig = {
    apiKey: "ali-manager-local-key",
    authDomain: "ali-manager-local.firebaseapp.com",
    projectId: "ali-manager-local",
    storageBucket: "ali-manager-local.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// --- ENVIRONMENT DETECTION ---
const isLocal = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.");

const firebaseConfig = isLocal ? emulatorConfig : prodConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- EMULATOR CONNECTION ---
if (isLocal) {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("🚀 Connected to Firebase Emulators");
} else {
    console.log("🌐 Connected to Production Firebase");
}

export { auth, db };
export default app;
