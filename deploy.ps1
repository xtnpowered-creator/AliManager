# Deploy Script for AliManager

Write-Host "1. Building React App..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failing. Exiting."
    exit $LASTEXITCODE
}

Write-Host "2. Deploying to Firebase..." -ForegroundColor Cyan
firebase deploy --only hosting

Write-Host "Done!" -ForegroundColor Green
Write-Host "NOTE: Ensure you have deployed the backend to Cloud Run manually or via CI/CD first as 'alimanager-api'." -ForegroundColor Yellow
