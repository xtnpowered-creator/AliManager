import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// --- PRODUCTION CONFIG ---
// TO DO: Replace these values with your actual keys from the Firebase Console!
// (Settings -> Project Settings -> General -> Your Apps)
const prodConfig = {
    apiKey: "AIzaSyCY6NpbaByRFjn_eBvMyfq-kaMWv0Z95XM",
    authDomain: "alimanager.firebaseapp.com",
    projectId: "alimanager",
    storageBucket: "alimanager.firebasestorage.app",
    messagingSenderId: "219329658388",
    appId: "1:219329658388:web:cdebdbb7e75629f95d3101",
    measurementId: "G-2E1505VX24"
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
const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.")
);

const firebaseConfig = isLocal ? emulatorConfig : prodConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- EMULATOR CONNECTION ---
// DISABLED: We use "God Mode" (AuthContext) and Postgres (API) for local dev.
// Connecting to emulators forces the app to crash if they aren't running.
/*
if (isLocal) {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("🚀 Connected to Firebase Emulators");
} else {
    console.log("🌐 Connected to Production Firebase");
}
*/

export { auth, db };
export default app;
