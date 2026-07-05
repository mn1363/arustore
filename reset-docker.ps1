# reset-docker.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AruStore - Docker Reset Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Stop all containers
Write-Host "`nStopping all containers..." -ForegroundColor Yellow
docker-compose down -v 2>$null

# Try to start Docker service
Write-Host "`nStarting Docker service..." -ForegroundColor Yellow
try {
    # Method 1: Start via net command
    net start com.docker.service 2>$null
    
    # Method 2: Start via process
    $dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerExe) {
        Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
        Start-Process $dockerExe -WindowStyle Hidden
    }
} catch {
    Write-Host "Could not start Docker automatically." -ForegroundColor Red
}

# Wait for Docker
Write-Host "`nWaiting for Docker to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    docker version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker is ready!" -ForegroundColor Green
        break
    }
    Write-Host "Waiting... ($attempt/$maxAttempts)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "`nERROR: Docker failed to start." -ForegroundColor Red
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Open Docker Desktop manually" -ForegroundColor White
    Write-Host "2. Check if Docker service is running in Services (services.msc)" -ForegroundColor White
    Write-Host "3. Restart your computer" -ForegroundColor White
    Read-Host "`nPress Enter to exit"
    exit 1
}

# Clean up old containers
Write-Host "`nCleaning up old containers..." -ForegroundColor Yellow
docker system prune -f 2>$null

# Build and start
Write-Host "`nBuilding and starting AruStore..." -ForegroundColor Green
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "SUCCESS! AruStore is running!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nAccess your application:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  MinIO: http://localhost:9001 (minioadmin/minioadmin123)" -ForegroundColor Cyan
    Write-Host "  RabbitMQ: http://localhost:15672 (aruuser/arupassword123)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "View logs: docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "Stop: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "`nERROR: Failed to start containers." -ForegroundColor Red
    Write-Host "Check logs: docker-compose logs" -ForegroundColor Yellow
}

Read-Host "`nPress Enter to exit"