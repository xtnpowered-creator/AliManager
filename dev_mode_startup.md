# Developer Mode Startup Guide

This document outlines the architecture and startup procedures for the AliManager development environment.

## 1. System Architecture

The local development environment requires **TWO (2)** processes:

1.  **Frontend (Vite)**: Serves the React Application.
    -   Port: `5181` (usually)
    -   Role: UI Rendering, acts as the Client.
2.  **Backend API (Express)**: Custom Node.js server.
    -   Port: `5001`
    -   Role: Handles API requests (`/api/users`, `/api/tasks`), connects to PostgreSQL, bypasses Auth in Dev.

**Note:** Firebase Emulators are **NO LONGER REQUIRED** for daily development. The app has been configured to bypass Firebase in dev mode.

---

## 2. Startup Instructions

Open **Two (2) Separate Terminals** and run the following commands in order:

### Terminal 1: Backend API (The Logic)
*Required for Data and User Profiles. If this is down, you will be stuck as **Guest**.*
```powershell
cd D:\MyApps\ForAlisara\AliManager\server
npm run dev
```
*Wait until you see "Server running on http://localhost:5001/api".*

### Terminal 2: Frontend (The UI)
*The React App itself.*
```powershell
cd D:\MyApps\ForAlisara\AliManager
npm run dev
```
*Access the app at the Local URL provided (e.g., http://localhost:5181).*

---

## 3. Troubleshooting Common Issues

### Issue: "I am logged in as Guest" / "White Screen" / "No Data"
**Cause:** The **Backend API** (Terminal 1) is likely not running or crashed.
**Fix:** Check Terminal 1. If stopped, run `npm run dev` in `server/` directory.

### Issue: "Network Error" on all requests
**Cause:** The **Backend API** (Terminal 1) is down.
**Fix:** Restart it.

### Issue: "React Query" / Import Errors
**Cause:** `npm install` dependencies might be out of sync.
**Fix:** Restart Terminal 2 (Frontend).

---

## 4. Mock Authentication (Dev Mode)
In Development, we bypass Firebase Auth tokens using custom headers:
-   **Header**: `x-god-mode-bypass: true`
-   **Header**: `x-mock-user-id: [UUID]`
-   **Switch User**: Click your Profile Icon -> Select a User from the "Dev: Switch User" list.
-   **Sign Out**: Clears the mocked ID and resets to "Guest" (or default).
