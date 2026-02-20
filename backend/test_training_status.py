from app.database import engine
from sqlalchemy.orm import Session
from app.models.assessment import Assessment

db = Session(engine)

print('=== Simulating backend training_status logic ===\n')

# Get all active assessments (same as backend)
raw_assessments = db.query(Assessment).filter(Assessment.is_active == True).all()

print(f'Found {len(raw_assessments)} active assessments:')
for a in raw_assessments:
    print(f'  ID {a.id}: {a.title:40} type={a.assessment_type}')

# Find quiz, code, and assignment (same logic as backend)
quiz_obj = next((a for a in raw_assessments if a.assessment_type == "quiz"), None)
code_obj = next((a for a in raw_assessments if a.assessment_type == "code"), None)
assign_obj = next((a for a in raw_assessments if a.assessment_type == "assignment"), None)

print('\n=== Training Status IDs ===')
print(f'quiz_id: {quiz_obj.id if quiz_obj else "None"} ({quiz_obj.title if quiz_obj else "N/A"})')
print(f'coding_id: {code_obj.id if code_obj else "None"} ({code_obj.title if code_obj else "N/A"})')
print(f'assignment_id: {assign_obj.id if assign_obj else "None"} ({assign_obj.title if assign_obj else "N/A"})')

db.close()
