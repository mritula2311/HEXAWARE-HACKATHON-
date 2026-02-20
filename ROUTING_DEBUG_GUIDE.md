# Routing Debug Guide

## Problem
Quiz button redirecting to software assignment instead of quiz page.

## What Was Fixed

### 1. **Stopped All Processes**
- Killed all processes on ports 3000 and 3001
- Cleared Next.js cache (.next folder)
- Fresh frontend build

### 2. **Added Comprehensive Debug Logging**

#### Dashboard Page Logs:
- `[DASHBOARD] Training Status:` - Shows IDs from backend
- `[DASHBOARD] Quiz button clicked - href: ...` - Shows generated link
- `[DASHBOARD] Assignment button clicked - href: ...` - Shows generated link

#### Assessment Pages Logs:
- `[QUIZ PAGE] Component mounted - assessmentId: X` - Quiz page loaded
- `[ASSIGNMENT PAGE] Component mounted - assessmentId: X` - Assignment page loaded
- `[CODE PAGE] Component mounted - assessmentId: X` - Code page loaded
- `[ASSESSMENTS] Starting assessment: ...` - Shows routing details

## Expected Behavior

### When clicking "Start Quiz" button:

1. **Console should show:**
```
[DASHBOARD] Training Status: {
  quiz_id: "1",
  quiz_title: "Python Basics Quiz",
  coding_id: "4",
  assignment_id: "3"
}

[DASHBOARD] Quiz button clicked - href: /dashboard/fresher/assessments/1/quiz quiz_id: 1

[QUIZ PAGE] Component mounted - assessmentId: 1

[QUIZ] Loading assessment 1
```

2. **URL should be:** `http://localhost:3000/dashboard/fresher/assessments/1/quiz`

3. **Page should show:** Python Basics Quiz

### When clicking "Start Assignment" button:

1. **Console should show:**
```
[DASHBOARD] Assignment button clicked - href: /dashboard/fresher/assessments/3/assignment assignment_id: 3

[ASSIGNMENT PAGE] Component mounted - assessmentId: 3

```

2. **URL should be:** `http://localhost:3000/dashboard/fresher/assessments/3/assignment`

3. **Page should show:** Software Architecture Report

## Testing Steps

### Step 1: Hard Refresh Browser
**Windows:** Press `Ctrl + Shift + R`
**Mac:** Press `Cmd + Shift + R`

This clears browser cache completely.

### Step 2: Open DevTools
Press `F12` or right-click → Inspect

Go to **Console** tab

### Step 3: Navigate to Dashboard
Go to: `http://localhost:3000/dashboard/fresher`

### Step 4: Check Training Status Log
Look for log line:
```
[DASHBOARD] Training Status: { quiz_id: "1", ... }
```

**Verify:** quiz_id should be "1" or 1

### Step 5: Click Quiz Button
Click the "Start Quiz" button under Python Quiz card

### Step 6: Check Logs
Look for these logs in order:
1. `[DASHBOARD] Quiz button clicked - href: /dashboard/fresher/assessments/1/quiz`
2. `[QUIZ PAGE] Component mounted - assessmentId: 1`

### Step 7: Check URL
Browser URL should be: `/dashboard/fresher/assessments/1/quiz`

## Database Verification

Current database state (verified correct):
```
ID 1: Python Basics Quiz           → type='quiz' ✓
ID 2: SQL Fundamentals Quiz         → type='quiz' ✓
ID 3: Software Architecture Report  → type='assignment' ✓
ID 4: FizzBuzz Coding Challenge     → type='code' ✓
```

Backend returns:
```
quiz_id: 1
coding_id: 4
assignment_id: 3
```

## If Problem Persists

### Scenario A: Wrong Page Component Loads
**Symptom:** Console shows `[ASSIGNMENT PAGE]` instead of `[QUIZ PAGE]`
**Cause:** Next.js routing issue
**Solution:** Restart Next.js dev server completely

### Scenario B: Wrong Assessment ID in Training Status
**Symptom:** `quiz_id: "3"` instead of `"1"`
**Cause:** Backend returning wrong data
**Solution:** Check backend logs, verify database hasn't changed

### Scenario C: Correct Logs But Wrong Page
**Symptom:** All logs correct but page content is wrong
**Cause:** Browser cache showing stale content
**Solution:** 
1. Open Incognito/Private window
2. Clear all browsing data (cache, cookies, everything)
3. Restart browser completely

### Scenario D: Everything Looks Correct
**If logs show:**
- `quiz_id: "1"` ✓
- `href: /dashboard/fresher/assessments/1/quiz` ✓
- `[QUIZ PAGE] Component mounted - assessmentId: 1` ✓

**But page shows wrong content:**
- Check if assessment ID 1 in database actually contains quiz questions
- Run: `cd backend; python check_types.py` to re-verify

## Nuclear Option (Last Resort)

If nothing works:
```powershell
# Stop all services
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Frontend: Delete everything and reinstall
cd "c:\panimalar hackathon\maverick-ai\frontend"
Remove-Item node_modules -Recurse -Force
Remove-Item .next -Recurse -Force
npm install
npm run dev

# Backend: Reset database
cd "c:\panimalar hackathon\maverick-ai\backend"
Remove-Item *.db -Force
python run_seed.py
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Service Status

Both services are currently running:
- ✓ **Backend:** http://localhost:8000
- ✓ **Frontend:** http://localhost:3000

All debug logging is active and ready.
