# PowerShell script to start the Marketing Tool application
# Usage: .\start-app.ps1

# Display banner
Write-Host "========================================"
Write-Host "   Marketing Tool Startup Script        "
Write-Host "========================================"
Write-Host ""

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port
    )
    $inUse = $null -ne (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue)
    return $inUse
}

# Check and stop existing processes
Write-Host "Checking for running processes..." -ForegroundColor Yellow
$stoppedNode = $false
$stoppedPython = $false

# Stop Node.js processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    $stoppedNode = $true
    Start-Sleep -Seconds 1
} else {
    Write-Host "No Node.js processes running." -ForegroundColor Green
}

# Stop Python processes
$pythonProcesses = Get-Process -Name python -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "Stopping Python processes..." -ForegroundColor Yellow
    $pythonProcesses | Stop-Process -Force
    $stoppedPython = $true
    Start-Sleep -Seconds 1
} else {
    Write-Host "No Python processes running." -ForegroundColor Green
}

# Check for port conflicts
$backendPort = 8000
$frontendPort = 5174

if (Test-PortInUse -Port $backendPort) {
    Write-Host "Warning: Port $backendPort is still in use. Backend may not start correctly." -ForegroundColor Red
}

if (Test-PortInUse -Port $frontendPort) {
    Write-Host "Warning: Port $frontendPort is still in use. Frontend may not start correctly." -ForegroundColor Red
}

# Check if database exists, offer to reset if it does
$dbPath = "marketing_tool.db"
$reset = $false
if (Test-Path -Path $dbPath) {
    Write-Host "Database file exists: $dbPath" -ForegroundColor Cyan
    $resetDb = Read-Host "Reset database? (y/n)"
    if ($resetDb -eq 'y') {
        Write-Host "Removing database files..." -ForegroundColor Yellow
        Remove-Item -Path $dbPath -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "app.db" -Force -ErrorAction SilentlyContinue
        $reset = $true
        Write-Host "Database files removed." -ForegroundColor Green
    }
}

# Run the database consistency script
Write-Host "Running database consistency check..." -ForegroundColor Cyan
python fix-database.py

# Set PYTHONPATH for the backend
$env:PYTHONPATH = '.'

# Start backend server in a new window
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\marketing_tool; $env:PYTHONPATH = '.'; uvicorn app.main:app --reload --host 0.0.0.0 --port $backendPort"

# Allow backend to initialize
Write-Host "Waiting for backend server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start frontend server in a new window
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\marketing_tool\frontend; npm start"

# Display access information
Write-Host ""
Write-Host "========================================"
Write-Host "Marketing Tool Started Successfully" -ForegroundColor Green
Write-Host "========================================"
Write-Host "Access the application:"
Write-Host "- Frontend: http://localhost:$frontendPort"
Write-Host "- Backend API: http://localhost:$backendPort"
Write-Host "- API Docs: http://localhost:$backendPort/docs"
Write-Host ""
Write-Host "Login with:"
Write-Host "- Email: admin@example.com"
Write-Host "- Password: admin123"
Write-Host "========================================" 