import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase Configuration Module
 * 
 * Initializes Firebase services for authentication, database, and storage.
 * 
 * Environment Behavior:
 * - Production: Connects to live Firebase project
 * - Development: Returns mock objects (prevents crashes without emulators)
 * 
 * Why Mock in Dev?
 * - App relies on backend API (127.0.0.1:5001) not Firebase directly
 * - Firebase auth bypassed via x-god-mode-bypass header in dev
 * - Prevents errors when Firebase emulators not running
 * 
 * Production Setup:
 * - Config values from Firebase Console (Project Settings > Your Apps)
 * - Project: alimanager.firebaseapp.com
 * - Handles real auth state changes via onAuthStateChanged
 * 
 * Development Setup:
 * - Mock auth object prevents import errors
 * - AuthContext uses mockUserId from localStorage
 * - API client sends mock user ID via x-mock-user-id header
 * 
 * @module firebase
 */

// Production Configuration
// Values from Firebase Console: https://console.firebase.google.com/project/alimanager/settings/general
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

if (!import.meta.env.DEV) {
    // PRODUCTION: Initialize real Firebase services
    console.log("🌐 Connected to Production Firebase");
    app = initializeApp(prodConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} else {
    // DEVELOPMENT: Export mocks to prevent import crashes
    console.log("🛠️ Dev Mode: Firebase Bypassed (API Mocking Active)");

    // Minimal Auth mock (prevents crashes in components that import auth)
    auth = {
        currentUser: null,
        signOut: async () => console.log("Mock SignOut"),
        onAuthStateChanged: (cb) => {
            return () => { }; // Return unsubscribe function
        }
    };

    // Empty mocks for db and storage
    db = {};
    storage = {};
    app = {};
}

export { auth, db, storage };
export default app;
