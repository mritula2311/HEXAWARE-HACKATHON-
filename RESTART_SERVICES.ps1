# MaverickAI - Restart Services Script
# This script restarts backend and frontend with updated HR evaluation system

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   MAVERICK AI - SERVICE RESTART" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Stop all existing services
Write-Host "[1/5] Stopping existing services..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "  ✓ Services stopped`n" -ForegroundColor Green

# Step 2: Reseed database with updated structure (no code challenges)
Write-Host "[2/5] Reseeding database (removing code challenges)..." -ForegroundColor Yellow
Set-Location "c:\panimalar hackathon\maverick-ai\backend"

if (Test-Path ".\venv\Scripts\Activate.ps1") {
    .\venv\Scripts\Activate.ps1
    Remove-Item "*.db" -Force -ErrorAction SilentlyContinue
    python run_seed.py
    Write-Host "  ✓ Database reseeded with quiz and assignment only`n" -ForegroundColor Green
} else {
    Write-Host "  ✗ Virtual environment not found!" -ForegroundColor Red
    exit 1
}

# Step 3: Start backend with HR evaluators
Write-Host "[3/5] Starting backend with HR evaluation system..." -ForegroundColor Yellow
Start-Job -ScriptBlock {
    Set-Location "c:\panimalar hackathon\maverick-ai\backend"
    .\venv\Scripts\Activate.ps1
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} | Out-Null
Start-Sleep -Seconds 5
Write-Host "  ✓ Backend started on http://localhost:8000`n" -ForegroundColor Green

# Step 4: Start frontend with updated admin dashboard
Write-Host "[4/5] Starting frontend with HR warnings dashboard..." -ForegroundColor Yellow
Set-Location "c:\panimalar hackathon\maverick-ai\frontend"
Start-Job -ScriptBlock {
    Set-Location "c:\panimalar hackathon\maverick-ai\frontend"
    npm run dev
} | Out-Null
Start-Sleep -Seconds 8
Write-Host "  ✓ Frontend started on http://localhost:3000`n" -ForegroundColor Green

# Step 5: Verify services
Write-Host "[5/5] Verifying services..." -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
$frontend = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   SERVICE STATUS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($backend) {
    Write-Host "  ✓ Backend:  http://localhost:8000" -ForegroundColor Green
    Write-Host "    - Swagger: http://localhost:8000/docs" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Backend: NOT RUNNING" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "  ✓ Frontend: http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "  ✗ Frontend: NOT RUNNING (may still be starting...)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   WHAT'S NEW" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "  1. CODE CHALLENGES REMOVED" -ForegroundColor Yellow
Write-Host "     - Only Quiz and Assignment assessments remain`n"

Write-Host "  2. HR-STYLE EVALUATION" -ForegroundColor Yellow
Write-Host "     - Professional corporate HR feedback"
Write-Host "     - Competency-based ratings"
Write-Host "     - Development plans and recommendations`n"

Write-Host "  3. AUTOMATIC WARNINGS SYSTEM" -ForegroundColor Yellow
Write-Host "     - 2 failures: Warning issued (development plan)"
Write-Host "     - 3+ failures: CRITICAL warning (termination review)"
Write-Host "     - Professional HR reasoning provided`n"

Write-Host "  4. ADMIN DASHBOARD ENHANCED" -ForegroundColor Yellow
Write-Host "     - New 'HR Warnings' tab"
Write-Host "     - Performance warnings with action items"
Write-Host "     - Overall cohort performance reports`n"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "  Login as Admin:" -ForegroundColor White
Write-Host "    Email: admin@maverick.ai"
Write-Host "    Password: admin123`n"

Write-Host "  Check HR Warnings:" -ForegroundColor White
Write-Host "    Dashboard → HR Warnings tab`n"

Write-Host "  Test Quiz Evaluation:" -ForegroundColor White
Write-Host "    Login as fresher → Take quiz → See HR feedback`n"

Write-Host "`n✨ System ready! Press Ctrl+C to stop services.`n" -ForegroundColor Green

# Keep script running
Write-Host "Monitoring services... (Press Ctrl+C to exit)`n" -ForegroundColor Gray
while ($true) {
    Start-Sleep -Seconds 30
    $backend = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    $frontend = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    
    if (-not $backend -or -not $frontend) {
        Write-Host " Service down detected! Check logs." -ForegroundColor Red
    }
}
