# Deploying AliManager to Production

This guide will walk you through setting up Google Cloud Platform (GCP) and deploying your app.

## Prerequisites
1.  **Google Cloud Account**: [console.cloud.google.com](https://console.cloud.google.com)
2.  **Firebase Project**: [console.firebase.google.com](https://console.firebase.google.com) (You likely already have this from your emulator work).

---

## Part 1: Initial Setup

### 1. Create a Google Cloud Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com).
2.  Click the Project Dropdown (top left) > **New Project**.
3.  Name it `alimanager-prod`.
4.  **Important**: Enable Billing for this project.

### 2. Install/Login to CLI
Since you have the tools installed, run these commands in your terminal (Command Prompt):

```cmd
cmd /c "gcloud auth login"
cmd /c "gcloud config set project [YOUR_PROJECT_ID]"
cmd /c "gcloud auth configure-docker"
```
*(Replace `[YOUR_PROJECT_ID]` with the ID found in the dashboard, usually `alimanager-prod-12345`)*

---

## Part 2: Database (Cloud SQL)

### 1. Create Instance
1.  Go to **SQL** in the Cloud Console sidebar.
2.  Click **Create Instance** > **PostgreSQL**.
3.  **Instance ID**: `alimanager-db`
4.  **Password**: Generate or choose a strong password. **SAVE THIS.**
5.  **Database Version**: PostgreSQL 16.
6.  **Region**: `us-central1` (or close to you).
7.  Click **Create Instance** (Takes 5-10 mins).

### 2. Create Database & User
1.  Once created, click on the instance `alimanager-db`.
2.  Go to **Databases** tab > **Create Database** > Name: `alimanager`.
3.  (Optional) Go to **Users** tab if you want a user other than `postgres`.

---

## Part 3: Backend (Cloud Run)

We will deploy the container image to Google Cloud Run.

### 1. Build & Push Image
Run this in your terminal from the `ForAlisara\AliManager` folder:

```cmd
cd server
cmd /c "gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/alimanager-api"
cd ..
```

### 2. Deploy Service
1.  Go to **Cloud Run** in the Console.
2.  Click **Create Service**.
3.  **Container Image URL**: Click Select > find `alimanager-api` (should be there from the previous step).
4.  **Service Name**: `alimanager-api`.
5.  **Region**: `us-central1`.
6.  **Authentication**: Select **"Allow unauthenticated invocations"** (Since our API handles its own Auth via Firebase).
7.  **Environment Variables** (Expand "Container, Networking, Security"):
    *   Click **Variables & Secrets** tab.
    *   Add the following:
        *   `DB_HOST`: `/cloudsql/[YOUR_PROJECT_ID]:us-central1:alimanager-db` *(This uses the socket path)*
        *   `DB_USER`: `postgres`
        *   `DB_PASS`: `[YOUR_PASSWORD]`
        *   `DB_NAME`: `alimanager`
8.  **Cloud SQL Connections** (Second tab in this section):
    *   Click "Add Connection" > Select `alimanager-db`.
9.  Click **Create**.

**Note the URL**: It will look like `https://alimanager-api-xyz.a.run.app`.

---

## Part 4: Frontend (Firebase Hosting)

Now we connect the frontend to that API URL.

### 1. Update Config (Optional but Cleaner)
Open `firebase.json` in your editor. ensure the rewrite region matches your Cloud Run region if using "serviceId", OR allow Firebase to auto-detect.

Since we are using `serviceId: alimanager-api`, Firebase needs to know we mean the Cloud Run service.
*Actually, the easiest way to link them often involves a specific CLI command, but the `firebase.json` rewrite works if the projects are linked.*

**Simpler Alternative**:
If the rewrite doesn't auto-work, you can manually set the API URL in your React app. But let's try the proxy first.

### 2. Deploy
Run the batch file I created:

```cmd
deploy.bat
```

This will:
1.  Build your React App.
2.  Push it to Firebase Hosting.

---

## Part 5: One Last Thing (Schema)

Your database is empty! You need to apply the schema.

### The "Quick" Way (Cloud Shell)
1.  In Google Cloud Console, click the **Terminal Icon** (top right) to open Cloud Shell.
2.  Upload your `setup.sql` and `server/setup_viral_loop.sql` files (Three dots menu > Upload).
3.  Connect to DB:
    ```bash
    gcloud sql connect alimanager-db --user=postgres --quiet
    ```
4.  Run the SQL:
    ```sql
    \i setup.sql
    \i setup_viral_loop.sql
    ```

**Done! Your app is live.**
