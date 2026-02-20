"""Verify the routing fix by checking training_status response"""
from app.database import SessionLocal
from app.models.assessment import Assessment

db = SessionLocal()

print("\n[DB] All Assessments in Database:")
assessments = db.query(Assessment).order_by(Assessment.id).all()
for a in assessments:
    print(f"  ID {a.id}: {a.title} (type: {a.assessment_type}, active: {a.is_active})")

print("\n[DB] Query Results:")
quiz_obj = db.query(Assessment).filter(
    Assessment.is_active == True,
    Assessment.assessment_type == "quiz"
).order_by(Assessment.id.asc()).first()

assign_obj = db.query(Assessment).filter(
    Assessment.is_active == True,
    Assessment.assessment_type == "assignment"
).order_by(Assessment.id.asc()).first()

if quiz_obj:
    print(f"  ✓ quiz_obj: ID {quiz_obj.id} - {quiz_obj.title}")
else:
    print("  ✗ quiz_obj: None")

if assign_obj:
    print(f"  ✓ assign_obj: ID {assign_obj.id} - {assign_obj.title}")
else:
    print("  ✗ assign_obj: None")

print("\n[FIX] Expected Routing:")
print(f"  Quiz Button → /dashboard/fresher/assessments/{quiz_obj.id if quiz_obj else 'N/A'}/quiz")
print(f"  Assignment Button → /dashboard/fresher/assessments/{assign_obj.id if assign_obj else 'N/A'}/assignment")

db.close()
