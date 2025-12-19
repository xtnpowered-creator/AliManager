# Database Migrations Workflow

Since your Production Database contains live data, you cannot simply "Drop and Re-create" tables like you do in development. You must applying incremental changes.

## The Workflow

1.  **Develop Locally**: Make changes to your local DB.
2.  **Capture SQL**: Save the command that made the change into a new file in this folder.
3.  **Deploy**: Connect to your Production DB (via DBeaver or Cloud Shell) and run that specific file.

## Naming Convention
Name files sequentially so you know the order to run them in:
-   `001_initial_schema.sql` (The base)
-   `002_viral_loop_update.sql` (The changes we just made)
-   `003_add_user_avatars.sql` (Future change...)

## How to Apply to Production

### Option A: DBeaver (Recommended)
1.  Connect DBeaver to your Google Cloud SQL instance (You'll need the Public IP and the password you created).
2.  Open the SQL file in DBeaver.
3.  Run it.

### Option B: Cloud Shell
1.  Open Cloud Shell in Google Cloud Console.
2.  Upload the migration file.
3.  Run: `psql -h [instance-ip] -U postgres -d alimanager -f 003_add_user_avatars.sql`
