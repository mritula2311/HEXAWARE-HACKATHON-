"""Test the actual API response for training_status"""
import requests
import json

# Login as fresher
login_data = {"email": "alice@maverick.ai", "password": "password123"}
login_response = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get dashboard data
    dashboard_response = requests.get("http://localhost:8000/api/v1/freshers/me/dashboard", headers=headers)
    
    if dashboard_response.status_code == 200:
        data = dashboard_response.json()
        training_status = data.get("training_status", {})
        
        print("\n[API TEST] Dashboard Response:")
        print(f"  quiz_id: {training_status.get('quiz_id')} (type: {type(training_status.get('quiz_id')).__name__})")
        print(f"  quiz_title: {training_status.get('quiz_title')}")
        print(f"  assignment_id: {training_status.get('assignment_id')} (type: {type(training_status.get('assignment_id')).__name__})")
        print(f"  assignment_title: {training_status.get('assignment_title')}")
        
        print("\n[API TEST] Expected URLs:")
        print(f"  Quiz: /dashboard/fresher/assessments/{training_status.get('quiz_id')}/quiz")
        print(f"  Assignment: /dashboard/fresher/assessments/{training_status.get('assignment_id')}/assignment")
        
        print("\n[API TEST] Full training_status:")
        print(json.dumps(training_status, indent=2))
    else:
        print(f"Dashboard request failed: {dashboard_response.status_code}")
        print(dashboard_response.text)
else:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
