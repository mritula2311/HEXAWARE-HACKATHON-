from app.database import engine
from sqlalchemy.orm import Session
from app.models.assessment import Assessment

db = Session(engine)

print('=== Assessment Type Verification ===')
assessments = db.query(Assessment).order_by(Assessment.id).all()

for a in assessments:
    print(f'ID {a.id}: "{a.title}" -> type="{a.assessment_type}"')

print('\n=== Checking for type mismatches ===')
quiz_with_wrong_type = db.query(Assessment).filter(
    Assessment.title.like('%Quiz%'),
    Assessment.assessment_type != 'quiz'
).all()

if quiz_with_wrong_type:
    print('FOUND QUIZZES WITH WRONG TYPE:')
    for a in quiz_with_wrong_type:
        print(f'  ID {a.id}: "{a.title}" has type="{a.assessment_type}" (should be "quiz")')
else:
    print('✓ All quizzes have correct type="quiz"')

assignment_with_wrong_type = db.query(Assessment).filter(
    Assessment.title.like('%Assignment%') | Assessment.title.like('%Report%'),
    Assessment.assessment_type != 'assignment'
).all()

if assignment_with_wrong_type:
    print('FOUND ASSIGNMENTS WITH WRONG TYPE:')
    for a in assignment_with_wrong_type:
        print(f'  ID {a.id}: "{a.title}" has type="{a.assessment_type}" (should be "assignment")')
else:
    print('✓ All assignments have correct type="assignment"')

db.close()
