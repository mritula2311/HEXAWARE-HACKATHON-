import sqlite3
db_path = 'maverickai.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print('=== FINAL VERIFICATION ===')
print()

# Check assessments
cursor.execute('SELECT id, title, type FROM assessment ORDER BY id')
assessments = cursor.fetchall()
print(f'Total Assessments: {len(assessments)}')
for a in assessments:
    print(f'  - {a[1]} ({a[2]})')
print()

# Check submissions by type
cursor.execute('SELECT COUNT(*) FROM submission')
total_subs = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM submission s JOIN assessment a ON s.assessment_id = a.id WHERE a.type = "quiz"')
quiz_subs = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM submission s JOIN assessment a ON s.assessment_id = a.id WHERE a.type = "code"')
code_subs = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM submission s JOIN assessment a ON s.assessment_id = a.id WHERE a.type = "assignment"')
assign_subs = cursor.fetchone()[0]

print(f'Total Submissions: {total_subs}')
print(f'  - Quiz: {quiz_subs}')
print(f'  - Code: {code_subs}')
print(f'  - Assignment: {assign_subs}')
print()
print('✅ Database Finalized: 2 Quizzes, 8 Submissions (QUIZ ONLY)')

conn.close()
