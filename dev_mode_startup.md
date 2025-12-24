# Developer Mode Startup Guide

This document outlines the architecture and startup procedures for the AliManager development environment.
If you encounter **Missing Data**, **"Guest" Login State**, or **Connection Refused** errors, verify that **ALL THREE** of the following processes are running.

## 1. System Architecture

The local development environment consists of three distinct processes that must run simultaneously:

1.  **Frontend (Vite)**: Serves the React Application.
    -   Port: `5181` (usually)
    -   Role: UI Rendering, acts as the Client.
2.  **Backend API (Express)**: Custom Node.js server.
    -   Port: `5001`
    -   Role: Handles API requests (`/api/users`, `/api/tasks`), connects to PostgreSQL, bypasses Auth in Dev.
3.  **Firebase Emulators**: Local Firebase instance.
    -   Ports: `9099` (Auth), `8080` (Firestore), `4000` (UI)
    -   Role: Handles Authentication tokens and legacy Firedata.

---

## 2. Startup Instructions

Open **Three (3) Separate Terminals** and run the following commands in order:

### Terminal 1: Firebase Emulators (The Backbone)
*Required for Auth and Database services.*
```powershell
cd D:\MyApps\ForAlisara\AliManager
npm run emulators
```
*Wait until you see "All emulators ready".*

### Terminal 2: Backend API (The Logic)
*Required for Data and User Profiles. If this is down, you will be stuck as **Guest**.*
```powershell
cd D:\MyApps\ForAlisara\AliManager\server
npm run dev
```
*Wait until you see "Server running on http://localhost:5001/api".*

### Terminal 3: Frontend (The UI)
*The React App itself.*
```powershell
cd D:\MyApps\ForAlisara\AliManager
npm run dev
```
*Access the app at the Local URL provided (e.g., http://localhost:5181).*

---

## 3. Troubleshooting Common Issues

### Issue: "I am logged in as Guest" / "White Screen" / "No Data"
**Cause:** The **Backend API** (Terminal 2) is likely not running or crashed.
-   The Frontend (`useAuth`) tries to fetch `/users/me`.
-   If the Backend is down, this request fails.
-   The App falls back to `null` user (Guest).
**Fix:** Check Terminal 2. If stopped, run `npm run dev` in `server/` directory.

### Issue: "Network Error" on all requests
**Cause:** The **Backend API** (Terminal 2) is down OR **Firebase Emulators** (Terminal 1) are down.
**Fix:** Restart both.

### Issue: "React Query" / Import Errors
**Cause:** `npm install` dependencies might be out of sync.
**Fix:** Restart Terminal 3 (Frontend).

---

## 4. Mock Authentication (Dev Mode)
In Development, we bypass Firebase Auth tokens using custom headers:
-   **Header**: `x-god-mode-bypass: true`
-   **Header**: `x-mock-user-id: [UUID]`

This logic resides in `server/index.js` (Middleware) and `src/api/client.js` (Client).
**If you cannot switch users**, ensure the Backend API is running, as it validates these headers.
