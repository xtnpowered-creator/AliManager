# Development Environment & God Mode Workflow

**Last Updated:** 2025-12-21

## 1. "God Mode" Authentication

In the local development environment (`npm run dev`), the system is hardcoded to bypass Firebase Authentication and instantly log you in as **Christian Plyler (System God)**.

### How it Works (The "Switcher" & "Header Bypass")
The system uses a two-pronged approach to bypass Firebase Authentication in Development:

1.  **Frontend (AuthContext):** Instantly sets the user state to "Christian Plyler" without waiting for Firebase.
2.  **API Client:** 
    *   Injects a custom header `x-god-mode-bypass: true`.
    *   **SKIPS** the `firebase.auth().currentUser.getIdToken()` call entirely (preventing connection refused errors).
3.  **Backend Middleware:** Detects this header (in Dev only) and forces the request context to be the God User, ignoring missing/invalid tokens.

This eliminates the need to run the Firebase Auth Emulator.

**Troubleshooting:**
-   If you ever appear as "Guest" or "Anonymous":
    -   Check `AuthContext.jsx` to ensure the `return` statement exists inside the `if (import.meta.env.DEV)` block.
    -   Refresh the page (F5).

## 2. Server Management

The application requires **two** separate terminal processes running concurrently.

### A. Backend Server
-   **Path:** `d:\MyApps\ForAlisara\AliManager\server`
-   **Command:** `npm run dev`
-   **Port:** 5001 (usually)
-   **Logs to Watch:** 
    -   `[Auth] God Mode: Target Acquired` (Confirms backend recognizes God)
    -   `[GET /tasks]` (Confirms data fetching)

### B. Frontend Server
-   **Path:** `d:\MyApps\ForAlisara\AliManager`
-   **Command:** `npm run dev`
-   **Port:** 5180 (http://localhost:5180/)

**Restart Procedure:**
If code changes are not reflecting or the session is stuck:
1.  **Kill All Node Processes:** `taskkill /F /IM node.exe` (Windows)
2.  **Start Backend:** `cd server && npm run dev`
3.  **Start Frontend:** `cd .. && npm run dev`

## 3. Database Identity

The "System God" is defined in the PostgreSQL database.
-   **ID:** `9f449545-700a-4ce5-8dd5-4d221041e15e`
-   **Email:** `xtnpowered@gmail.com`
-   **Role:** `god`

This ID must match the ID hardcoded in `AuthContext.jsx`.

## 4. Current Critical Features (Timeline)

The **Timeline View** uses a custom Pointer Events engine (`useTimelineSelection.js`).
-   **Selection:** Shift + Drag
-   **Event Logic:** Uses `setPointerCapture` to lock dragging to the container.
