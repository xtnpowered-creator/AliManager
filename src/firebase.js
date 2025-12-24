import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

let app = null;
let auth = null;
let db = null;
let storage = null;

// Only initialize Firebase if NOT in Dev mode (or explicitly requested via flag)
// This prevents the app from crashing if Emulators are not running.
if (!import.meta.env.DEV) {
    console.log("🌐 Connected to Production Firebase");
    app = initializeApp(prodConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} else {
    // DEV MODE MOCKS
    // We export dummy objects so imports don't crash.
    console.log("🛠️ Dev Mode: Firebase Bypassed (Emulators Override)");

    // Minimal Mock for Auth
    auth = {
        currentUser: null,
        signOut: async () => console.log("Mock SignOut"),
        onAuthStateChanged: (cb) => {
            // Immediately return logic if needed, or just do nothing
            return () => { }; // Unsubscribe function
        }
    };

    // Minimal Mock for DB
    db = {};
    storage = {};
    app = {};
}

export { auth, db, storage };
export default app;
