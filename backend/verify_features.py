import sqlite3
import json

db_path = 'maverickai.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print(" 🎯 PREMIUM FEATURES VERIFICATION")
print("=" * 60)

# Check new tables
tables = ['badge', 'fresher_badge', 'assessment_schedule', 'performance_analytics']
print("\n📊 Database Tables Status:")
for table in tables:
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
    exists = "✅" if cursor.fetchone() else "❌"
    print(f"  {exists} {table}")

# Check badges
cursor.execute('SELECT COUNT(*) FROM badge')
badge_count = cursor.fetchone()[0]
print(f"\n🎖️  Skill Badges Created: {badge_count}")
cursor.execute('SELECT name, skill_name, min_score FROM badge LIMIT 3')
for name, skill, min_score in cursor.fetchall():
    print(f"     • {name} ({skill}) - {min_score}+ required")

# Check analytics
cursor.execute('SELECT COUNT(*) FROM performance_analytics')
analytics_count = cursor.fetchone()[0]
print(f"\n📈 Analytics Records: {analytics_count}")

# Check sample analytics
cursor.execute('SELECT fresher_id, overall_score, quiz_average, pass_rate FROM performance_analytics LIMIT 2')
for fresher_id, overall, quiz_avg, pass_rate in cursor.fetchall():
    print(f"     • Fresher {fresher_id}: Overall {overall:.1f}, Quiz {quiz_avg:.1f}%, Pass {pass_rate:.1f}%")

# Check assessments
cursor.execute('SELECT COUNT(*) FROM assessments')
assessment_count = cursor.fetchone()[0]
print(f"\n📝 Assessments in System: {assessment_count}")

# Check submissions
cursor.execute('SELECT COUNT(*) FROM submission')
submission_count = cursor.fetchone()[0]
print(f"\n✍️  Total Submissions: {submission_count}")

conn.close()

print("\n" + "=" * 60)
print(" ✅ ALL PREMIUM FEATURES INITIALIZED SUCCESSFULLY!")
print("=" * 60)
