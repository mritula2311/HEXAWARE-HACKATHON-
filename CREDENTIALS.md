# MaverickAI System Credentials

## 🔐 User Accounts

### **Fresher Accounts (Engineering)**
| Email | Password | Name | Role | Department |
|-------|----------|------|------|------------|
| alice@maverick.ai | password123 | Alice Thompson | Fresher | Engineering |
| bob@maverick.ai | password123 | Bob Martinez | Fresher | Engineering |
| emily@maverick.ai | password123 | Emily Davis | Fresher | Engineering |

### **Fresher Accounts (Data Science)**
| Email | Password | Name | Role | Department |
|-------|----------|------|------|------------|
| john@maverick.ai | password123 | John Smith | Fresher | Data Science |
| carol@maverick.ai | password123 | Carol White | Fresher | Data Science |
| fresher2@maverick.ai | fresher123 | Fresher Two | Fresher | Data Science |

### **Fresher Accounts (DevOps)**
| Email | Password | Name | Role | Department |
|-------|----------|------|------|------------|
| sarah@maverick.ai | password123 | Sarah Chen | Fresher | DevOps |
| david@maverick.ai | password123 | David Lee | Fresher | DevOps |

### **Fresher Accounts (QA)**
| Email | Password | Name | Role | Department |
|-------|----------|------|------|------------|
| mike@maverick.ai | password123 | Mike Wilson | Fresher | QA |

### **Generic Test Accounts**
| Email | Password | Name | Role | Department |
|-------|----------|------|------|------------|
| fresher1@maverick.ai | fresher123 | Fresher One | Fresher | Engineering |

### **Management & Admin**
| Email | Password | Name | Role | Department |
|-------|----------|------|------|------------|
| manager@maverick.ai | password123 | James Manager | Manager | Engineering |
| admin@maverick.ai | admin123 | Admin User | Admin | IT |
| mentor@maverick.ai | password123 | Mentor Lead | Mentor | Engineering |

---

## 🎯 Recommended Test Users

### **For Testing AI Feedback & Assessments:**
- **Best Performer:** alice@maverick.ai (Has multiple completed assessments with high scores)
- **Average Performer:** bob@maverick.ai (Good scores across assessments)
- **At-Risk Performer:** john@maverick.ai (Low scores, needs intervention)

### **For Manager Dashboard:**
- **manager@maverick.ai** - View all freshers, reports, analytics

### **For Admin Functions:**
- **admin@maverick.ai** - Full system access

---

## 🚀 Quick Start

### **Login URL:**
```
http://localhost:3000/login
```

### **API Base URL:**
```
http://localhost:8000/api/v1
```

### **Default Ports:**
- Frontend (Next.js): `3000`
- Backend (FastAPI): `8000`

---

## 📊 Sample Data

All fresher accounts have:
- ✅ Pre-seeded assessments (quizzes, coding challenges, assignments)
- ✅ AI-generated feedback on completed submissions
- ✅ Learning schedules and progress tracking
- ✅ Skills and achievements
- ✅ Risk assessment data

---

## 🔧 Resetting Data

To reseed the database with fresh data:
```bash
cd backend
python force_seed_assessments.py
```

---

## ⚠️ Security Note

**These are development credentials only!**
- Never use these passwords in production
- Change all default passwords before deployment
- Implement proper authentication in production environments
