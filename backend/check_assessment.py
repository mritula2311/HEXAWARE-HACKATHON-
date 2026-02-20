import sqlite3

conn = sqlite3.connect('maverickai.db')
cursor = conn.cursor()

# Check assessment 3
cursor.execute('SELECT id, title, assessment_type FROM assessments WHERE id = 3')
print('Assessment 3:', cursor.fetchone())

# Check recent submissions
cursor.execute('SELECT id, assessment_id, submission_type, status FROM submissions WHERE assessment_id = 3 ORDER BY id DESC LIMIT 5')
print('\nRecent submissions for assessment 3:')
for row in cursor.fetchall():
    print(row)

conn.close()
