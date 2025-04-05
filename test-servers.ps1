# PowerShell script to test if the servers are running properly
# Usage: .\test-servers.ps1

Write-Host "========================================"
Write-Host "   Marketing Tool Server Test          "
Write-Host "========================================"
Write-Host ""

# Function to test if a URL is reachable
function Test-Endpoint {
    param (
        [string]$Url,
        [string]$Name
    )
    
    Write-Host "Testing $Name at $Url..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200) {
            Write-Host "SUCCESS: $Name is running (Status: $statusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "WARNING: $Name returned status code $statusCode" -ForegroundColor Yellow
            return $false
        }
    } catch {
        $errorMessage = $_.Exception.Message
        Write-Host "ERROR: $Name is not responding - $errorMessage" -ForegroundColor Red
        return $false
    }
}

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port,
        [string]$ServiceName
    )
    
    Write-Host "Checking if $ServiceName port $Port is in use..." -ForegroundColor Yellow
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        
        if ($connections) {
            $processId = $connections[0].OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                Write-Host "SUCCESS: $ServiceName port $Port is in use by process $($process.Name) (PID: $processId)" -ForegroundColor Green
                return $true
            } else {
                Write-Host "WARNING: $ServiceName port $Port is in use but can't identify the process" -ForegroundColor Yellow
                return $true
            }
        } else {
            Write-Host "ERROR: $ServiceName port $Port is not in use by any process" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "ERROR: Failed to check $ServiceName port $Port - $_" -ForegroundColor Red
        return $false
    }
}

# Check if servers are running by testing ports
$backendPort = 8000
$frontendPort = 5174

$backendPortRunning = Test-PortInUse -Port $backendPort -ServiceName "Backend"
$frontendPortRunning = Test-PortInUse -Port $frontendPort -ServiceName "Frontend"

# If ports are in use, test endpoints
$backendRunning = $false
$frontendRunning = $false

if ($backendPortRunning) {
    # Test backend endpoints
    $backendHealthEndpoint = "http://localhost:$backendPort"
    $backendDocsEndpoint = "http://localhost:$backendPort/docs"
    
    $backendRunning = Test-Endpoint -Url $backendHealthEndpoint -Name "Backend API"
    if ($backendRunning) {
        Test-Endpoint -Url $backendDocsEndpoint -Name "Backend API Docs" | Out-Null
    }
}

if ($frontendPortRunning) {
    # Test frontend endpoint
    $frontendEndpoint = "http://localhost:$frontendPort"
    $frontendRunning = Test-Endpoint -Url $frontendEndpoint -Name "Frontend"
}

# Summary
Write-Host ""
Write-Host "========================================"
Write-Host "           Test Summary               "
Write-Host "========================================"

if ($backendRunning -and $frontendRunning) {
    Write-Host "All services are running properly!" -ForegroundColor Green
} elseif ($backendRunning) {
    Write-Host "Backend is running, but Frontend is not available" -ForegroundColor Yellow
} elseif ($frontendRunning) {
    Write-Host "Frontend is running, but Backend is not available" -ForegroundColor Yellow
} else {
    Write-Host "Both Backend and Frontend are not running!" -ForegroundColor Red
}

Write-Host ""
Write-Host "If services are not running, start them with:"
Write-Host "  .\start-app.ps1"
Write-Host "========================================" 