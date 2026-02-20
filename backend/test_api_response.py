"""Test what the backend API actually returns for training_status"""
from app.database import SessionLocal
from app.models.assessment import Assessment
from app.models.user import User
from app.models.fresher import Fresher
from app.models.assessment import Submission

db = SessionLocal()

try:
    # Get a fresher user
    user = db.query(User).filter(User.role == "fresher").first()
    if not user:
        print("❌ No fresher user found!")
        exit(1)
    
    fresher = db.query(Fresher).filter(Fresher.user_id == user.id).first()
    if not fresher:
        print("❌ No fresher object found!")
        exit(1)
    
    print(f"Testing with user: {user.email} (fresher_id: {fresher.id})")
    print()
    
    # Simulate the backend logic
    raw_assessments = db.query(Assessment).filter(Assessment.is_active == True).all()
    subs = db.query(Submission).filter(Submission.user_id == user.id).all()
    
    print("=== ALL ASSESSMENTS ===")
    for a in raw_assessments:
        print(f"  ID {a.id}: {a.title[:40]:<40} type={a.assessment_type}")
    print()
    
    # Find objects by type (same logic as freshers.py endpoint)
    quiz_obj = next((a for a in raw_assessments if a.assessment_type == "quiz"), None)
    code_obj = next((a for a in raw_assessments if a.assessment_type == "code"), None)
    assign_obj = next((a for a in raw_assessments if a.assessment_type == "assignment"), None)
    
    print("=== TRAINING STATUS (what API returns) ===")
    training_status = {
        "quiz_id": str(quiz_obj.id) if quiz_obj else "",
        "quiz_title": quiz_obj.title if quiz_obj else "Daily Quiz",
        "coding_id": str(code_obj.id) if code_obj else "",
        "coding_title": code_obj.title if code_obj else "Coding Challenge",
        "assignment_id": str(assign_obj.id) if assign_obj else "",
        "assignment_title": assign_obj.title if assign_obj else "Assignment",
    }
    
    import json
    print(json.dumps(training_status, indent=2))
    print()
    
    # Verify the URLs that will be generated
    print("=== EXPECTED BUTTON URLS ===")
    print(f"Quiz button: /dashboard/fresher/assessments/{training_status['quiz_id']}/quiz")
    print(f"Code button: /dashboard/fresher/assessments/{training_status['coding_id']}/code")
    print(f"Assignment button: /dashboard/fresher/assessments/{training_status['assignment_id']}/assignment")
    print()
    
    # Verify by fetching each assessment
    print("=== VERIFY EACH ASSESSMENT ===")
    for id_key, type_key in [('quiz_id', 'quiz'), ('coding_id', 'code'), ('assignment_id', 'assignment')]:
        aid = training_status[id_key]
        if aid:
            a = db.query(Assessment).filter(Assessment.id == int(aid)).first()
            if a:
                status = "✓" if a.assessment_type == type_key else "✗"
                print(f"{status} ID {aid}: Expected type='{type_key}', actual type='{a.assessment_type}'")
                if a.assessment_type != type_key:
                    print(f"  WARNING: TYPE MISMATCH! This will cause routing errors!")
    
finally:
    db.close()
