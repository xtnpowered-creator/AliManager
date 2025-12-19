$PG_BIN = "D:\Program Files\PostgreSQL\16\bin"
$DATA_DIR = "$PSScriptRoot\postgres_data"
$LOG_FILE = "$PSScriptRoot\postgres.log"
$PORT = 5433 # Using 5433 to avoid conflict with potential default service on 5432

function Init-DB {
    if (Test-Path $DATA_DIR) {
        Write-Host "Data directory already exists at $DATA_DIR" -ForegroundColor Yellow
        return
    }
    Write-Host "Initializing Database in $DATA_DIR..." -ForegroundColor Cyan
    & "$PG_BIN\initdb.exe" -D "$DATA_DIR" -U postgres -A trust -E UTF8
}

function Start-DB {
    if (-not (Test-Path $DATA_DIR)) {
        Write-Error "Data directory not found. Run Init-DB first."
        return
    }
    Write-Host "Starting Database on Port $PORT..." -ForegroundColor Cyan
    # Start in background
    $job = Start-Process -FilePath "$PG_BIN\pg_ctl.exe" -ArgumentList "start -D `"$DATA_DIR`" -l `"$LOG_FILE`" -o `"-p $PORT`"" -PassThru -Wait
    
    # Wait a moment for it to spin up
    Start-Sleep -Seconds 3
    Write-Host "Database started (check logs at $LOG_FILE if issues)." -ForegroundColor Green
}

function Stop-DB {
    Write-Host "Stopping Database..." -ForegroundColor Cyan
    & "$PG_BIN\pg_ctl.exe" stop -D "$DATA_DIR"
}

function Status-DB {
    & "$PG_BIN\pg_ctl.exe" status -D "$DATA_DIR"
}

function Create-App-DB {
    Write-Host "Creating 'alimanager' database..."
    & "$PG_BIN\createdb.exe" -p $PORT -U postgres alimanager
}

# Simple argument parsing
switch ($args[0]) {
    "init" { Init-DB }
    "start" { Start-DB }
    "stop" { Stop-DB }
    "status" { Status-DB }
    "create-db" { Create-App-DB }
    "setup" { 
        Init-DB
        Start-DB
        Create-App-DB
    }
    default {
        Write-Host "Usage: .\manage_db.ps1 [init|start|stop|status|create-db|setup]"
    }
}
