import sqlite3
import json

conn = sqlite3.connect('maverickai.db')
cursor = conn.cursor()

# Get the most recent assignment submission feedback
cursor.execute('''
    SELECT id, assessment_id, submission_type, feedback 
    FROM submissions 
    WHERE assessment_id = 3 
    ORDER BY id DESC 
    LIMIT 1
''')

row = cursor.fetchone()
if row:
    print(f"Submission ID: {row[0]}")
    print(f"Assessment ID: {row[1]}")
    print(f"Submission Type: {row[2]}")
    print(f"\nFeedback JSON:")
    feedback = json.loads(row[3])
    print(json.dumps(feedback, indent=2))
    
    # Check what fields exist
    print("\n\nFields in feedback:")
    for key in feedback.keys():
        print(f"  - {key}")

conn.close()
