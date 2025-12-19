# Setting up CI/CD with GitHub Actions

To enable the automated pipeline (`deploy-prod.yml`), you need to add keys to your GitHub Repository.

## 1. Get Google Cloud Service Account Key
1.  Go to **IAM & Admin** > **Service Accounts** in Cloud Console.
2.  Click **Create Service Account** -> Name it `github-actions`.
3.  Grant Roles:
    *   `Cloud Run Admin`
    *   `Service Account User`
    *   `Storage Admin` (for Container Registry)
    *   `Artifact Registry Admin`
4.  Click **Done**.
5.  Click the three dots on the new account > **Manage Keys**.
6.  **Add Key** > **Create new key** > **JSON**.
7.  The file will download. **Open it and copy the entire text content.**

## 2. Add Secrets to GitHub
1.  Go to **GitHub Repo** > **Settings** > **Secrets and variables** > **Actions**.
2.  Click **New repository secret**.
3.  Add the following secrets:

| Name | Value |
|------|-------|
| `GCP_CREDENTIALS` | The entire content of the JSON file you just downloaded. |
| `GCP_PROJECT_ID` | Your Project ID (e.g., `alimanager-prod-123`). |
| `DB_PASS` | The postgres password you created for Cloud SQL. |

## 3. Trigger Deployment
1.  Commit and Push your changes to `main`.
2.  Go to **Actions** tab in GitHub to watch it fly!
