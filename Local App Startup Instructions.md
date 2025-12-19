# Full-Stack Setup: React + Express + Postgres

The application has been refactored to use a secure Backend API.

## 1. Architecture
- **Frontend**: React (Vite) on Port 5180
- **Backend**: Express API on Port 5001
- **Database**: PostgreSQL 16 on Port 5433

## 2. Running the App (The "Two-Terminal" Workflow)
You need to run both the Backend and Frontend.

### **Terminal 1: Backend (API)**
```powershell
# 1. Start Database (if not running)
.\manage_db.ps1 start

# 2. Start API Server
node server/dev.js
```
*Output should say: `[Dev] Server running on port 5001`*

### **Terminal 2: Frontend (React)**
```powershell
npm run dev
```
*Open http://localhost:5180*

## 3. Key Features
- **God Mode**: Login with `christianplyler@gmail.com` or `xtnpowered@gmail.com` to auto-receive the `god` role.
- **Data Flow**: Dashboard Project list is now fetched from Postgres via `/api/projects`.

## 4. DBeaver Connection Setup
1. Open DBeaver.
2. Click **New Database Connection** (Plug icon).
3. Select **PostgreSQL** and click Next.
4. Fill in the settings:
   - **Host**: `localhost`
   - **Port**: `5433` (This is non-standard, make sure to change it!)
   - **Database**: `alimanager`
   - **Username**: `postgres`
   - **Password**: *(Leave Empty)*
5. Click **Test Connection**.
6. Click **Finish**.

## 5. Troubleshooting
- **DB Connection**: Ensure port 5433 is free and `manage_db.ps1 status` says "Unix running" (or Windows path).
- **API Errors**: Check the Terminal 1 console for `[API] GET /...` logs.
- **Port Conflicts**: If 5001 is taken, kill the process or change `PORT` in `server/dev.js`.
