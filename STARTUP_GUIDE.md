# MaverickAI - Startup Guide

## Problem Fixed
The network error was caused by:
1. ✅ Inconsistent API URLs (127.0.0.1 vs localhost) - **FIXED**
2. ✅ Missing/incorrect environment configuration - **FIXED**
3. ⚠️ Backend service not running - **YOU NEED TO START IT**

## How to Start MaverickAI

### Option 1: Docker Compose (Recommended - All-in-one)
```bash
cd c:\panimalar hackathon\maverick-ai

# Start all services (PostgreSQL, MongoDB, Ollama, Backend, Frontend)
docker-compose up -d

# Check if services are running
docker-compose ps

# View backend logs
docker-compose logs -f fastapi
```

### Option 2: Manual Setup (Development)

#### Step 1: Start the Backend (Terminal 1)
```bash
cd c:\panimalar hackathon\maverick-ai\backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Wait for this message to appear:
```
[READY] MaverickAI API ready at http://localhost:8000
[DOCS] Swagger docs at http://localhost:8000/docs
```

#### Step 2: Start the Frontend (Terminal 2)
```bash
cd c:\panimalar hackathon\maverick-ai\frontend

# Install dependencies (first time only)
npm install

# Run the frontend
npm run dev
```

The frontend will start at: **http://localhost:3000**

#### Step 3: Test the Application
1. Open browser: http://localhost:3000
2. Login with demo credentials:
   - Email: `admin@maverick.ai`
   - Password: `admin123`
   OR
   - Email: `fresher1@maverick.ai`
   - Password: `fresher123`

## Verify Backend is Running
```bash
# Check if backend is accessible
curl http://localhost:8000/health

# Open API docs
# Go to: http://localhost:8000/docs
```

## Environment Configuration
Frontend environment file: `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_ENABLE_MOCK_API=false
```

This is already configured correctly. ✅

## Troubleshooting

### If you still see "Network error":
1. **Check Backend Status**
   ```bash
   curl http://localhost:8000/health
   ```
   Expected response: `{"status":"healthy","service":"MaverickAI API","version":"1.0.0"}`

2. **Check Console Logs**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for `[AUTH]` messages showing the API URL being used

3. **Verify API URL**
   - It should be: `http://localhost:8000/api/v1`
   - NOT `http://127.0.0.1:8000/api/v1`

4. **Port Conflicts**
   ```bash
   # Check if ports are in use
   netstat -ano | findstr :8000  # Backend
   netstat -ano | findstr :3000  # Frontend
   ```

5. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   - Clear localStorage: F12 > Application > Clear All

## Quick Status Check Commands

```bash
# Backend health check
curl http://localhost:8000/health

# Frontend check (once running)
curl http://localhost:3000

# View all API endpoints
http://localhost:8000/docs
```

## Important Notes
- Backend MUST be running before attempting login
- Frontend environment is already configured to use `http://localhost:8000/api/v1`
- All error messages now show the API URL and connection details
- Browser console will log connection attempts for debugging

---

**Next Steps:**
1. Choose Option 1 (Docker) or Option 2 (Manual)
2. Start both services
3. Visit http://localhost:3000
4. Login with demo credentials
5. If error persists, check console logs and verify backend health

