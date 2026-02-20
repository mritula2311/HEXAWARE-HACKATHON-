# MaverickAI — Complete Project Inventory

> AI-powered multi-agent platform for autonomous fresher onboarding and training.
> Location: `c:\panimalar hackathon\maverick-ai`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend Routes (API Endpoints)](#2-backend-routes-api-endpoints)
3. [Backend Agents](#3-backend-agents)
4. [Backend Models (Database Schema)](#4-backend-models-database-schema)
5. [Backend Utils](#5-backend-utils)
6. [Backend Core Modules](#6-backend-core-modules)
7. [Backend Schemas](#7-backend-schemas)
8. [Backend Config & Startup](#8-backend-config--startup)
9. [Seed Data](#9-seed-data)
10. [Frontend Pages & Components](#10-frontend-pages--components)
11. [Frontend API Service](#11-frontend-api-service)
12. [Frontend Auth Context](#12-frontend-auth-context)
13. [Frontend Types & Utilities](#13-frontend-types--utilities)
14. [Frontend Hooks](#14-frontend-hooks)
15. [Frontend UI Components](#15-frontend-ui-components)
16. [Infrastructure & Config Files](#16-infrastructure--config-files)
17. [Dependencies](#17-dependencies)

---

## 1. Architecture Overview

| Layer | Technology | Details |
|-------|-----------|---------|
| **Backend** | FastAPI (Python 3) | REST API at port 8000, prefix `/api/v1` |
| **Frontend** | Next.js 14 (TypeScript) | App Router, port 3000 |
| **Database** | SQLite (dev) / PostgreSQL (docker) | SQLAlchemy ORM, 15 tables |
| **LLM** | Ollama (phi3:latest) | Local inference at port 11434 |
| **PDF** | fpdf2 + reportlab | Dual PDF generation systems |
| **Auth** | JWT (python-jose) + bcrypt | Bearer token, 1440 min expiry |
| **Automation** | n8n webhooks | Email notifications at port 5678 |
| **Styling** | Tailwind CSS + Radix UI | With custom CSS-in-JS on landing page |
| **Charts** | Recharts | Bar, Line, Area, Pie charts on manager dashboard |
| **Code Editor** | Monaco Editor | In-browser coding assessments |

### Multi-Agent System

| Agent | Alias | Purpose |
|-------|-------|---------|
| `OnboardingAgent` | "The Architect" | Generates personalized daily schedules |
| `AssessmentAgent` | "The Evaluator" | Grades quiz/code/assignment submissions |
| `QuizEvaluatorAgent` | — | Specialized HR-style quiz evaluation |
| `AssignmentEvaluatorAgent` | — | HR document/project assessment |
| `AnalyticsAgent` | "The Strategist" | Predicts risk, cohort analysis |
| `ProfileAgent` | "The Librarian" | Updates skills, awards badges |
| `ReportingAgent` | "The Communicator" | Generates PDF/JSON reports |

---

## 2. Backend Routes (API Endpoints)

### 2.1 Auth — `backend/app/api/routes/auth.py`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/login` | Login with email/password → JWT token + user dict |
| `POST` | `/api/v1/auth/register` | Register new user (email, password, first_name, last_name, role, department) |
| `GET` | `/api/v1/auth/me` | Get current authenticated user |

**Helpers:** `_user_dict(user, db)` — serializes User with fresher_id lookup.

---

### 2.2 Freshers — `backend/app/api/routes/freshers.py` (435 lines)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/freshers/me` | Fresher's own dashboard (full data) |
| `GET` | `/api/v1/freshers/user/{user_id}` | Get fresher by user_id |
| `GET` | `/api/v1/freshers` | List all freshers (query: department, status, skill, search) |
| `GET` | `/api/v1/freshers/{fresher_id}` | Get fresher by ID |
| `GET` | `/api/v1/freshers/{fresher_id}/dashboard` | Full dashboard data (progress, schedule, skills, achievements, training, workflow) |
| `GET` | `/api/v1/freshers/{fresher_id}/skills` | Fresher's skills list |
| `GET` | `/api/v1/freshers/{fresher_id}/training-status` | Quiz/assignment/certification completion status |
| `GET` | `/api/v1/freshers/{fresher_id}/workflow-status` | Daily workflow completion checklist |
| `GET` | `/api/v1/freshers/{fresher_id}/assessment-evaluations` | AI-powered evaluation history (completed/graded only) |
| `GET` | `/api/v1/freshers/schedule-items/{item_id}` | Get schedule item details |
| `PUT` | `/api/v1/freshers/{fresher_id}` | Update fresher profile |

**Helpers:** `_fresher_dict(fresher, user, db)`, `_build_dashboard(fresher, user, db)` — comprehensive dashboard builder with training_status, badges, skills, schedule, workflow.

---

### 2.3 Agents — `backend/app/api/routes/agents.py`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/agents/generate-schedule` | Generate daily schedule via OnboardingAgent |
| `POST` | `/api/v1/agents/grade` | Grade submission (quiz→QuizEvaluator, assignment→AssignmentEvaluator) |
| `POST` | `/api/v1/agents/predict-risk` | Predict risk for a fresher via AnalyticsAgent |
| `POST` | `/api/v1/agents/update-profile` | Update profile via ProfileAgent |
| `GET` | `/api/v1/agents/metrics` | Agent metrics (hardcoded mock data) |
| `GET` | `/api/v1/agents/{agent_name}/status` | Get specific agent status |

---

### 2.4 Assessments — `backend/app/api/routes/assessments.py` (~400 lines)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/assessments/` | List all active assessments |
| `GET` | `/api/v1/assessments/my/pending` | Pending assessments for current user |
| `GET` | `/api/v1/assessments/my/completed` | Completed assessments for current user |
| `GET` | `/api/v1/assessments/{assessment_id}` | Get assessment detail (quiz questions rotated daily to 5 via seeded random) |
| `POST` | `/api/v1/assessments/{assessment_id}/start` | Start assessment, creates Submission record |
| `POST` | `/api/v1/assessments/submissions/{submission_id}/answers` | Submit answers for grading |
| `GET` | `/api/v1/assessments/submissions/{submission_id}/results` | Get graded results with sanitized feedback |
| `GET` | `/api/v1/assessments/{assessment_id}/latest-result` | Latest completed result for assessment |

**Helpers:** `_assessment_detail(assessment)`, `_sanitize_feedback(feedback)`, `_select_daily_questions(questions, count=5)`.

---

### 2.5 Analytics — `backend/app/api/routes/analytics.py`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/analytics/dashboard` | Full manager dashboard (summary, alerts, trends, risk distribution, top performers, department stats, agent metrics, reports) |
| `GET` | `/api/v1/analytics/alerts` | List alerts (query: status, level) |
| `POST` | `/api/v1/analytics/alerts/{alert_id}/acknowledge` | Acknowledge an alert |
| `GET` | `/api/v1/analytics/cohort/{cohort_type}/{cohort_value}` | Cohort analysis (mock data) |
| `GET` | `/api/v1/analytics/trends` | Progress trends over days |
| `GET` | `/api/v1/analytics/departments` | Department-level statistics |

---

### 2.6 Admin — `backend/app/api/routes/admin.py` (~300 lines)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/users` | List all users |
| `POST` | `/api/v1/admin/users` | Create new user (with auto-fresher creation for role=fresher) |
| `POST` | `/api/v1/admin/bulk/assign-mentor` | Bulk assign mentor to freshers |
| `GET` | `/api/v1/admin/stats` | System statistics (total users, freshers, assessments, submissions) |
| `GET` | `/api/v1/admin/freshers/details` | All freshers with full details |
| `GET` | `/api/v1/admin/freshers/{fresher_id}/details` | Single fresher full details |
| `POST` | `/api/v1/admin/seed-data` | Seed test data |
| `GET` | `/api/v1/admin/warnings` | Performance warnings for repeated failures |
| `GET` | `/api/v1/admin/overall-report` | Overall cohort performance report |

**Helpers:** `_build_fresher_details(fresher, db)` — comprehensive object with training/workflow/skills/certifications/submissions.

---

### 2.7 Certifications — `backend/app/api/routes/certifications.py` (280 lines)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/certifications/fresher/{fresher_id}` | List certifications for fresher |
| `POST` | `/api/v1/certifications/fresher/{fresher_id}` | Create certification |
| `PUT` | `/api/v1/certifications/{certification_id}` | Update certification (auto-complete at 100%) |
| `DELETE` | `/api/v1/certifications/{certification_id}` | Delete certification |
| `GET` | `/api/v1/certifications/assignment-history/fresher/{fresher_id}` | Assignment history |
| `GET` | `/api/v1/certifications/assignment-history/submission/{submission_id}` | Submission version history |
| `POST` | `/api/v1/certifications/assignment-history` | Create assignment history record |

---

### 2.8 Curricula — `backend/app/api/routes/curricula.py`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/curricula` | List all curricula |
| `GET` | `/api/v1/curricula/{curriculum_id}` | Get curriculum by ID |
| `GET` | `/api/v1/curricula/fresher/{fresher_id}` | Get fresher's curriculum (returns first) |

---

### 2.9 Reports — `backend/app/api/routes/reports.py`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/reports/generate/{report_type}` | Generate report via ReportingAgent (types: department, cohort, individual) |
| `POST` | `/api/v1/reports/individual` | Individual HR assessment report |
| `POST` | `/api/v1/reports/department` | Department report |
| `POST` | `/api/v1/reports/cohort` | Cohort report |
| `GET` | `/api/v1/reports` | List all reports |
| `GET` | `/api/v1/reports/{report_id}/download` | Download report (PDF or JSON) |

---

### 2.10 Schedules — `backend/app/api/routes/schedules.py`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/schedules/fresher/{fresher_id}/today` | Today's schedule |
| `GET` | `/api/v1/schedules/fresher/{fresher_id}/week` | Week schedule |
| `GET` | `/api/v1/schedules/fresher/{fresher_id}/date/{schedule_date}` | Schedule by date |
| `GET` | `/api/v1/schedules/items/{item_id}` | Get schedule item |
| `POST` | `/api/v1/schedules/items/{item_id}/start` | Start schedule item |
| `POST` | `/api/v1/schedules/items/{item_id}/complete` | Complete schedule item |
| `POST` | `/api/v1/schedules/generate` | Generate schedule via OnboardingAgent |

---

### 2.11 Premium — `backend/app/api/routes/premium.py` (463 lines)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/badges` | List all badges |
| `GET` | `/api/v1/freshers/{fresher_id}/badges` | Fresher's earned badges |
| `POST` | `/api/v1/freshers/{fresher_id}/badges/{badge_id}` | Assign badge manually |
| `GET` | `/api/v1/assessments/{assessment_id}/schedules` | Assessment schedules |
| `POST` | `/api/v1/assessments/{assessment_id}/schedule` | Create assessment schedule |
| `GET` | `/api/v1/freshers/{fresher_id}/schedules` | Fresher's upcoming schedules |
| `GET` | `/api/v1/freshers/{fresher_id}/analytics` | Fresher performance analytics |
| `GET` | `/api/v1/analytics/cohort-comparison` | Cohort comparison dashboard |
| `POST` | `/api/v1/analytics/update/{fresher_id}` | Recalculate fresher analytics |
| `GET` | `/api/v1/submissions/{submission_id}/pdf` | Export submission as PDF |
| `GET` | `/api/v1/freshers/{fresher_id}/performance-report/pdf` | Performance report PDF |
| `POST` | `/api/v1/submissions/{submission_id}/ai-feedback` | Generate AI feedback |
| `GET` | `/api/v1/freshers/{fresher_id}/ai-insights` | AI performance insights |

---

### 2.12 Quiz Config — `backend/app/api/routes/quiz_config.py` (239 lines)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/quiz-evaluator/config` | Get evaluator config + stats |
| `PUT` | `/api/v1/quiz-evaluator/config` | Update config (admin only) |
| `PUT` | `/api/v1/quiz-evaluator/competency-thresholds` | Update thresholds (admin only) |
| `PUT` | `/api/v1/quiz-evaluator/feedback-templates` | Update templates (admin only) |
| `PUT` | `/api/v1/quiz-evaluator/llm-prompt` | Update LLM prompt (admin only) |
| `POST` | `/api/v1/quiz-evaluator/presets/{preset_name}` | Apply preset (beginner/intermediate/advanced/expert) |
| `GET` | `/api/v1/quiz-evaluator/presets` | List available presets |
| `POST` | `/api/v1/quiz-evaluator/reset` | Reset to defaults (admin only) |

---

### 2.13 Workflows — `backend/app/api/routes/workflows.py` (232 lines)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/workflows/submit` | Submit workflow (quiz/assignment/code), runs grading synchronously, auto-updates profile |
| `GET` | `/api/v1/workflows/status/{trace_id}` | Get workflow status by trace_id (deep sanitization for React safety) |
| `GET` | `/api/v1/workflows/fresher-dashboard` | Fresher dashboard shortcut |
| `GET` | `/api/v1/workflows/manager-dashboard` | Manager dashboard shortcut |

---

### 2.14 Routes Init — `backend/app/api/routes/__init__.py`

Exports all routers used by `main.py`.

---

## 3. Backend Agents

### 3.1 `BaseAgent` — `backend/app/agents/base.py`

```python
class BaseAgent(ABC):
    name: str
    description: str
    def call_llm(self, prompt: str, system: str = None) -> str  # Uses llm_client singleton
    @abstractmethod
    def execute(self, db: Session, *args, **kwargs) -> dict
```

### 3.2 `OnboardingAgent` — `backend/app/agents/onboarding_agent.py`

- Alias: **"The Architect"**
- `execute(db, fresher, target_date) -> dict` — Generates personalized daily schedule
  - Creates `Schedule` + `ScheduleItem` records
  - LLM prompt includes fresher's current_week, skills, progress
  - Fallback: hardcoded 6-task schedule (reading → coding → quiz → video → coding → reading)

### 3.3 `AssessmentAgent` — `backend/app/agents/assessment_agent.py` (640 lines)

- Alias: **"The Evaluator"**
- `execute(db, submission, assessment) -> dict` — Routes to type-specific grading
- `_grade_quiz(submission, assessment)` — Auto-grades against correct answers + LLM feedback
- `_grade_code(submission, assessment)` — Executes Python with test cases (70% test + 30% style score via LLM)
- `_grade_assignment(submission, assessment)` — LLM evaluation of written content
- Records `AssignmentHistory` for assignment submissions

### 3.4 `QuizEvaluatorAgent` — `backend/app/agents/quiz_evaluator_agent.py` (~400 lines)

- Specialized HR-style quiz evaluator, fully configurable
- **Key Methods:**
  - `evaluate(db, submission, assessment) -> dict` — Auto-grades + generates HR corporate feedback
  - `update_config(config_dict)` — Update evaluator configuration
  - `get_config() -> dict` — Get current config
  - `update_feedback_templates(templates)` — Customize feedback messages
  - `update_competency_thresholds(thresholds)` — Set competency level thresholds
  - `update_llm_prompt_template(template)` — Customize LLM prompt
  - `get_evaluation_stats(db) -> dict` — Statistics on evaluations performed
- **Config Options:** `daily_question_count`, `competency_thresholds`, `feedback_templates`, `scoring_weights`
- **Competency Levels:** exceeds_expectations (≥90), meets_expectations (≥70), developing (≥50), needs_improvement (<50)
- **Presets:** beginner, intermediate, advanced, expert

### 3.5 `AssignmentEvaluatorAgent` — `backend/app/agents/assignment_evaluator_agent.py` (~400 lines)

- HR document/project assessment
- `evaluate(db, submission, assessment) -> dict` — HR-style feedback on written assignments
- **Scoring Criteria:**
  - Content Quality: 30%
  - Communication: 25%
  - Professional Presentation: 20%
  - Critical Thinking: 15%
  - Practical Application: 10%
- Fallback based on word count heuristic

### 3.6 `AnalyticsAgent` — `backend/app/agents/analytics_agent.py`

- Alias: **"The Strategist"**
- `predict_risk(db, fresher) -> dict` — Uses LLM + deterministic fallback; creates `Alert` for high/critical risk
- `cohort_analysis(db) -> dict` — Aggregates progress/risk stats across all freshers

### 3.7 `ProfileAgent` — `backend/app/agents/profile_agent.py` (203 lines)

- Alias: **"The Librarian"**
- `update_after_assessment(db, fresher, submission, assessment) -> dict` — Updates skills (weighted average), awards achievements (score≥90), awards badges via `_check_and_award_badges()`, updates overall_progress
- `generate_fresher_summary(db, fresher) -> str` — LLM-powered skill portrait
- `_check_and_award_badges(db, fresher, assessment, score)` — Awards badges based on skill thresholds

### 3.8 `ReportingAgent` — `backend/app/agents/reporting_agent.py` (772 lines)

- Alias: **"The Communicator"**
- `generate_report(db, report_type, filters, user) -> dict` — LLM-powered PDF/JSON reports; stores `Report` in DB; sends to n8n webhook
- `generate_individual_hr_report(db, fresher_id) -> dict` — Comprehensive HR assessment for single fresher
- `generate_overall_performance_report(db) -> dict` — Cohort-wide report with warnings
- `check_repeated_failures(db) -> list` — Detects 2-3+ quiz failures for HR warnings
- `generate_warnings_report(db) -> dict` — Dedicated warnings list

---

## 4. Backend Models (Database Schema)

### 4.1 `User` — `backend/app/models/user.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | Auto-increment |
| `email` | String(100) | Unique, indexed |
| `first_name` | String(50) | |
| `last_name` | String(50) | |
| `hashed_password` | String(255) | bcrypt hash |
| `role` | String(20) | fresher / mentor / manager / admin |
| `department` | String(50) | Nullable |
| `is_active` | Boolean | Default True |
| `created_at` | DateTime | Auto |
| `updated_at` | DateTime | Auto-update |

### 4.2 `Fresher` — `backend/app/models/fresher.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `user_id` | FK → users | |
| `employee_id` | String(20) | Unique |
| `mentor_id` | FK → users | Nullable |
| `manager_id` | FK → users | Nullable |
| `join_date` | String(20) | |
| `onboarding_end_date` | String(20) | Nullable |
| `current_week` | Integer | Default 1 |
| `overall_progress` | Float | Default 0.0 |
| `risk_level` | String(20) | Default "low" |
| `risk_score` | Float | Default 0.0 |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |

**Relationships:** `badges` (FresherBadge), `assessment_schedules` (AssessmentSchedule), `performance_analytics` (PerformanceAnalytics)

### 4.3 `Skill` — `backend/app/models/fresher.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `fresher_id` | FK → freshers | |
| `name` | String(50) | |
| `category` | String(50) | |
| `level` | Float | Default 0.0 |
| `trend` | String(10) | up/down/flat |
| `assessments_count` | Integer | Default 0 |

### 4.4 `Achievement` — `backend/app/models/fresher.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `fresher_id` | FK → freshers | |
| `title` | String(100) | |
| `icon` | String(10) | Emoji |
| `description` | String(200) | |
| `earned_at` | DateTime | Auto |

### 4.5 `Assessment` — `backend/app/models/assessment.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `title` | String(200) | |
| `description` | Text | |
| `assessment_type` | String(20) | quiz / code / assignment |
| `time_limit_minutes` | Integer | Default 30 |
| `max_score` | Integer | Default 100 |
| `passing_score` | Integer | Default 60 |
| `max_attempts` | Integer | Default 3 |
| `instructions` | Text | |
| `module_id` | String(50) | Nullable |
| `weight` | Float | Default 1.0 |
| `rubric` | Text (JSON) | |
| `starter_code` | Text | Nullable |
| `test_cases` | Text (JSON) | |
| `questions` | Text (JSON) | Array of {id, question, type, options, correct_answer, points} |
| `skills_assessed` | Text (JSON) | |
| `language` | String(20) | Nullable |
| `is_active` | Boolean | Default True |
| `is_published` | Boolean | Default True |
| `available_from` | DateTime | Nullable |
| `available_until` | DateTime | Nullable |
| `created_at` | DateTime | |

### 4.6 `Submission` — `backend/app/models/assessment.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `assessment_id` | FK → assessments | |
| `user_id` | FK → users | |
| `submission_type` | String(20) | quiz / code / assignment |
| `code` | Text | Nullable |
| `language` | String(20) | Nullable |
| `answers` | Text (JSON) | Nullable |
| `score` | Float | Nullable |
| `max_score` | Float | Nullable |
| `passing_score` | Float | Nullable |
| `pass_status` | String(10) | pass / fail / pending |
| `status` | String(20) | pending / completed / graded |
| `feedback` | Text (JSON) | |
| `test_results` | Text (JSON) | |
| `trace_id` | String(50) | Nullable |
| `submitted_at` | DateTime | Auto |
| `graded_at` | DateTime | Nullable |

### 4.7 `Report` — `backend/app/models/report.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `title` | String(200) | |
| `report_type` | String(50) | |
| `format` | String(10) | pdf / json |
| `generated_by` | FK → users | |
| `file_path` | String(500) | Nullable |
| `content` | Text (JSON) | |
| `generated_at` | DateTime | Auto |

### 4.8 `Alert` — `backend/app/models/report.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `fresher_id` | FK → freshers | |
| `fresher_name` | String(100) | |
| `risk_level` | String(20) | |
| `risk_score` | Float | |
| `reason` | Text | |
| `status` | String(20) | new / acknowledged / resolved |
| `created_at` | DateTime | Auto |

### 4.9 `Badge` — `backend/app/models/badge.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `name` | String(100) | Unique |
| `description` | String(255) | |
| `icon_url` | String(255) | Nullable |
| `skill_name` | String(100) | Nullable |
| `min_score` | Float | Default 0 |
| `color` | String(20) | Default "blue" |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |

### 4.10 `FresherBadge` — `backend/app/models/badge.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `fresher_id` | FK → freshers | |
| `badge_id` | FK → badges | |
| `assessment_id` | FK → assessments | Nullable |
| `score_achieved` | Float | Default 0 |
| `earned_at` | DateTime | Auto |

**Relationships:** `fresher`, `badge`, `assessment`

### 4.11 `Certification` — `backend/app/models/certification.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `fresher_id` | FK → freshers | |
| `name` | String(200) | |
| `provider` | String(100) | Nullable |
| `status` | String(20) | Default "not_started" |
| `progress` | Integer | 0–100 |
| `target_completion_date` | String(20) | Nullable |
| `completion_date` | String(20) | Nullable |
| `certification_url` | String(500) | Nullable |
| `certificate_url` | String(500) | Nullable |
| `notes` | Text | Nullable |
| `is_mandatory` | Boolean | Default False |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |

### 4.12 `AssignmentHistory` — `backend/app/models/certification.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `submission_id` | FK → submissions | |
| `fresher_id` | FK → freshers | |
| `assessment_id` | FK → assessments | |
| `version` | Integer | Default 1 |
| `content` | Text | |
| `status` | String(20) | Default "submitted" |
| `score` | Float | Nullable |
| `feedback` | Text (JSON) | |
| `submitted_at` | DateTime | Auto |
| `graded_at` | DateTime | Nullable |

### 4.13 `Schedule` — `backend/app/models/schedule.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `fresher_id` | FK → freshers | |
| `schedule_date` | String(20) | |
| `status` | String(20) | Default "pending" |
| `created_at` | DateTime | Auto |

### 4.14 `ScheduleItem` — `backend/app/models/schedule.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `schedule_id` | FK → schedules | |
| `title` | String(200) | |
| `description` | Text | |
| `item_type` | String(20) | reading / quiz / video / coding / project |
| `duration_minutes` | Integer | Default 30 |
| `status` | String(20) | Default "pending" |
| `topic` | String(100) | Nullable |
| `start_time` | String(10) | Nullable |
| `end_time` | String(10) | Nullable |
| `content` | Text | Nullable |
| `external_url` | String(500) | Nullable |
| `assessment_id` | FK → assessments | Nullable |

### 4.15 `Curriculum` — `backend/app/models/curriculum.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `name` | String(200) | |
| `description` | Text | |
| `duration_weeks` | Integer | |
| `modules` | Text (JSON) | Array of {id, name, week_number, topics, learning_objectives} |
| `created_at` | DateTime | Auto |

### 4.16 `AssessmentSchedule` — `backend/app/models/schedule_assessment.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `assessment_id` | FK → assessments | |
| `fresher_id` | FK → freshers | Nullable |
| `scheduled_date` | String(20) | |
| `deadline` | String(20) | Nullable |
| `duration_minutes` | Integer | Default 30 |
| `is_active` | Boolean | Default True |
| `is_mandatory` | Boolean | Default False |
| `reminder_sent` | Boolean | Default False |
| `description` | Text | Nullable |
| `special_instructions` | Text | Nullable |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |

### 4.17 `PerformanceAnalytics` — `backend/app/models/analytics.py`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer (PK) | |
| `fresher_id` | FK → freshers | |
| `overall_score` | Float | Default 0 |
| `quiz_average` | Float | Default 0 |
| `assessment_count` | Integer | Default 0 |
| `passed_count` | Integer | Default 0 |
| `failed_count` | Integer | Default 0 |
| `pass_rate` | Float | Default 0 |
| `skills_breakdown` | Text (JSON) | |
| `score_trend` | Text (JSON) | Nullable |
| `improvement_rate` | Float | Default 0 |
| `avg_time_spent` | Float | Default 0 |
| `completion_rate` | Float | Default 0 |
| `risk_level` | String(20) | Default "low" |
| `risk_score` | Float | Default 0 |
| `engagement_score` | Float | Default 0 |
| `last_assessment_date` | DateTime | Nullable |
| `cohort_rank` | Integer | Nullable |
| `cohort_percentile` | Float | Nullable |
| `updated_at` | DateTime | Auto |

---

## 5. Backend Utils

### 5.1 `MaverickPDF` — `backend/app/utils/pdf_generator.py` (421 lines)

- Extends `FPDF` (fpdf2 library)
- Branded purple header with gradient
- `generate_pdf_report(report_title, content_json) -> bytes`
  - Renders: executive summary, highlights, recommendations, assessment stats table, detailed analysis sections
  - Individual HR report sections: performance overview, technical competency, professional skills, detailed assessment analysis, HR recommendations, placement recommendation, manager notes, HR action items
  - Overall report sections: executive insights, statistics, fresher performance log table, warnings
  - Catch-all handler for any unhandled top-level keys
  - Disclaimer footer
- **Helper functions:** `sanitize_text()`, `_check_page_space()`, `_render_section_header()`, `_render_bullet_list()`, `_render_numbered_list()`, `_render_dict_section()`, `_render_key_value()`

### 5.2 `PDFGenerator` — `backend/app/utils/pdf_generator_v2.py`

- Uses reportlab library
- `generate_submission_pdf(submission_data) -> bytes` — Individual submission PDF
- `generate_performance_report_pdf(analytics_data) -> bytes` — Performance analytics PDF
- Singleton instance: `pdf_generator`

### 5.3 `PersonalizedFeedbackGenerator` — `backend/app/utils/feedback_generator.py`

- Uses `llm_client` for AI-powered feedback
- `generate_submission_feedback(submission_data) -> dict` — AI feedback on a submission
- `generate_performance_insights(analytics_data) -> dict` — Strategic performance insights
- `generate_skill_deep_dive(skill_data) -> dict` — Skill-specific mastery guidance
- Singleton instance: `feedback_generator`

---

## 6. Backend Core Modules

### 6.1 `OllamaClient` — `backend/app/core/llm_client.py`

```python
class OllamaClient:
    def __init__(self, base_url=None)
    def is_available(self) -> bool          # Checks /api/tags endpoint
    def generate(self, prompt, model=None, system=None, temperature=0.7) -> str
    def _mock_response(self, prompt) -> str  # Keyword-based mock JSON responses
```

- Singleton: `llm_client`
- Auto-fallback to mock responses when Ollama is unavailable
- Mock responses for: report, schedule, code review/grade, risk/analytics, quiz

### 6.2 Security — `backend/app/core/security.py`

```python
def _truncate(password: str) -> str           # Truncate to 72 bytes (bcrypt limit)
def verify_password(plain, hashed) -> bool    # bcrypt verify
def get_password_hash(password) -> str        # bcrypt hash
def create_access_token(data, expires_delta=None) -> str  # JWT encode (HS256)
def decode_access_token(token) -> Optional[dict]          # JWT decode
```

### 6.3 API Dependencies — `backend/app/api/deps.py`

```python
security = HTTPBearer()

def get_current_user(credentials, db) -> User   # Validates JWT, returns User
def require_role(*roles)                          # Decorator factory for role-based access
```

---

## 7. Backend Schemas

### 7.1 Auth Schemas — `backend/app/schemas/auth.py`

```python
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: Optional[str] = "fresher"
    department: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1440
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    department: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: str
```

---

## 8. Backend Config & Startup

### 8.1 `Settings` — `backend/app/config.py`

```python
class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./maverickai.db"
    SECRET_KEY: str = "maverickai-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "phi3:latest"
    OLLAMA_CODE_MODEL: str = "phi3:latest"
    OLLAMA_FAST_MODEL: str = "phi3:latest"
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook/alert"
    CORS_ORIGINS: list = ["http://localhost:3000", ...]
```

### 8.2 `database.py` — `backend/app/database.py`

- `engine` — SQLAlchemy engine (SQLite/PostgreSQL)
- `SessionLocal` — Session factory
- `Base` — Declarative base
- `get_db()` — FastAPI dependency (yields session)
- `create_tables()` — Imports all models, calls `Base.metadata.create_all()`

### 8.3 `main.py` — `backend/app/main.py`

- FastAPI app with CORS middleware (origins: `["*"]`)
- **12 routers mounted:**
  1. `auth_router` → `/api/v1/auth`
  2. `freshers_router` → `/api/v1/freshers`
  3. `agents_router` → `/api/v1/agents`
  4. `assessments_router` → `/api/v1/assessments`
  5. `analytics_router` → `/api/v1/analytics`
  6. `admin_router` → `/api/v1/admin`
  7. `curricula_router` → `/api/v1/curricula`
  8. `reports_router` → `/api/v1/reports`
  9. `schedules_router` → `/api/v1/schedules`
  10. `premium_router` → `/api/v1`
  11. `quiz_config_router` → `/api/v1/quiz-evaluator`
  12. `workflows_router` → `/api/v1/workflows`
  13. `certifications_router` → `/api/v1/certifications`
- **Startup event:** `create_tables()` + auto-seeds via `seed_database()`

---

## 9. Seed Data

### `backend/app/seed.py` (491 lines)

**`seed_database(db)` creates:**

| Entity | Count | Details |
|--------|-------|---------|
| **Users** | 6 | 4 freshers + 1 admin + 1 manager |
| **Freshers** | 4 | Alice (78%, low risk), John (35%, critical), Bob (75%, low), Emily (48%, medium) |
| **Skills** | 24 | 6 skills × 4 freshers (React, Node.js, Python, Docker, JavaScript, Communication) |
| **Achievements** | 6 | First Login, React Master, 3-Day Streak, Quick Learner, On Track |
| **Schedules** | 4 | One per fresher for today, each with 5 items |
| **Assessments** | 3 | Python Basics Quiz (10 questions), SQL Fundamentals Quiz (5 questions), Software Architecture Report (assignment) |
| **Submissions** | 8 | 2 per fresher (Python quiz + SQL quiz), with LLM-generated feedback |
| **Alerts** | 2 | John (critical, 85), Emily (medium, 52) |
| **Badges** | 6 | Python Master (90+), Python Expert (85+), SQL Champion (90+), SQL Pro (85+), Quick Learner (70+), Consistent Performer (75+) |
| **Badge Assignments** | Auto | Based on score matching |
| **PerformanceAnalytics** | 4 | One per fresher, computed from submissions |
| **Curriculum** | 1 | "Software Engineering Foundation" — 12 weeks, 12 modules |

**Test Credentials:**

| Email | Password | Role |
|-------|----------|------|
| `alice@maverick.ai` | `password123` | fresher |
| `john@maverick.ai` | `password123` | fresher |
| `bob@maverick.ai` | `password123` | fresher |
| `emily@maverick.ai` | `password123` | fresher |
| `admin@maverick.ai` | `admin123` | admin |
| `manager@maverick.ai` | `password123` | manager |

---

## 10. Frontend Pages & Components

### 10.1 Root Layout — `frontend/src/app/layout.tsx`

- Inter font, wraps children in `<AuthProvider>`
- Meta: "MaverickAI - Intelligent Onboarding Platform"

### 10.2 Landing Page — `frontend/src/app/page.tsx` (367 lines)

- `LandingPage` component
- Sections: announcement bar, navbar, hero (with product preview card), logos, features grid, CTA
- Uses Playfair Display font, Lucide icons, CSS-in-JS styling
- Links to `/login`

### 10.3 Login Page — `frontend/src/app/login/page.tsx` (374 lines)

- `LoginPage` — Combined login/register form
- Features: email/password fields, show/hide password, social login placeholders (Google, GitHub)
- Auto-redirects authenticated users by role
- Uses `useAuth()` for `login()` and `register()`

### 10.4 Signup Page — `frontend/src/app/signup/page.tsx`

- `SignupPage` — Dedicated registration form
- Fields: first name, last name, email, password, confirm password
- Terms & privacy checkbox
- Auto-redirects on successful registration

### 10.5 Admin Dashboard — `frontend/src/app/dashboard/admin/page.tsx` (323 lines)

- `AdminDashboardPage`
- Redirects non-admins to their appropriate dashboard
- **Sections:**
  - Stats cards (Users, Freshers, Assessments, Submissions)
  - Create User form (email, password, name, role, department)
  - User list table with role badges
  - Seed test data button
  - "Switch to Manager view" link
  - Logout button

### 10.6 Fresher Layout — `frontend/src/app/dashboard/fresher/layout.tsx`

- `FresherDashboardLayout` — Auth guard for fresher role
- Shows loading spinner while verifying auth
- Redirects to `/login` if not authenticated or wrong role

### 10.7 Fresher Dashboard — `frontend/src/app/dashboard/fresher/page.tsx` (603 lines)

- `FresherDashboardPage` — Main fresher view
- **Features:**
  - Sidebar navigation (Dashboard, Assessments, Schedule, Profile)
  - Progress overview cards
  - Embedded `SQLQuizWidget` (5-question interactive SQL quiz)
  - Training status section (quiz, coding, assignment, certification)
  - Editable certification card (name, progress, status)
  - Editable to-do list (add/remove/toggle items)
  - Editable daily schedule (add/edit/remove items)
  - Assessment evaluation history (collapsible, shows scores/feedback)
  - Skills radar with progress bars
  - Badges display
  - Achievements list
  - Auto-refreshes on window focus

### 10.8 Assessments List — `frontend/src/app/dashboard/fresher/assessments/page.tsx` (249 lines)

- `AssessmentsPage` — Lists all available assessments
- Filter tabs: All / Quizzes / Assignments
- Assessment cards with type badges, scores, start buttons
- Routes to type-specific pages on start

### 10.9 Quiz Page — `frontend/src/app/dashboard/fresher/assessments/[id]/quiz/page.tsx` (436 lines)

- `QuizSubmissionPage` — Interactive quiz taking
- Features: question navigation (prev/next/jump), answer selection, countdown timer, auto-submit on timeout, confirmation dialog
- Submits via `api.workflow.submit()`, redirects to results with trace_id

### 10.10 Code Page — `frontend/src/app/dashboard/fresher/assessments/[id]/code/page.tsx` (420 lines)

- `CodeSubmissionPage` — Code editor for coding challenges
- Monaco Editor integration (dynamically imported, SSR disabled)
- Features: language selection, run tests (simulated), code reset, countdown timer
- Default code templates for Python, JavaScript, Java, C++

### 10.11 Assignment Page — `frontend/src/app/dashboard/fresher/assessments/[id]/assignment/page.tsx` (371 lines)

- `AssignmentPage` — Written assignment submission
- Features: rich textarea with word/char count, file upload (max 10MB), countdown timer
- Submits as `submission_type: 'code'` with `language: 'text'` for AI evaluation

### 10.12 Results Page — `frontend/src/app/dashboard/fresher/assessments/[id]/results/page.tsx` (601 lines)

- `ResultsPage` — Assessment results and AI feedback
- Handles two flows:
  1. **With trace_id:** Polls `api.workflow.getStatus()` every 2s (up to 30 polls)
  2. **Without trace_id:** Fetches `api.assessment.getLatestResult()`
- Displays: score, pass/fail, risk level, feedback (strengths, weaknesses, suggestions, missing points, errors, improvements), test results, rubric scores
- `toDisplayString()` helper handles LLM JSON objects gracefully

### 10.13 Schedule Page — `frontend/src/app/dashboard/fresher/schedule/page.tsx`

- `SchedulePage` — Weekly training schedule view
- Fetches `api.schedule.getWeek()`
- Groups items by day with status indicators

### 10.14 Profile Page — `frontend/src/app/dashboard/fresher/profile/page.tsx` (340 lines)

- `FresherProfilePage` — Editable profile with demo data fallback
- **Sections:** Avatar & basic info, Education (degree, university, graduation year), Learning Preferences (style, daily capacity), Skills with progress bars
- Edit mode toggles inline form fields

### 10.15 Learning Page — `frontend/src/app/dashboard/fresher/learning/[id]/page.tsx` (340 lines)

- `LearningPage` — Schedule item detail/learning content view
- Supports: video (YouTube iframe), reading (content card), general (file)
- Mark as Complete button → auto-redirects to dashboard after 1.5s

### 10.16 Manager Layout — `frontend/src/app/dashboard/manager/layout.tsx`

- Pass-through layout (returns children directly)

### 10.17 Manager Dashboard — `frontend/src/app/dashboard/manager/page.tsx` (811 lines)

- `ManagerDashboard` — Comprehensive management view
- **Sidebar tabs:** Overview, Freshers, Agents, Reports
- **Overview tab:**
  - Summary cards (Total, Active, At-Risk, Completed freshers, Avg Progress, Avg Risk)
  - Progress Trend chart (Line/Area via Recharts)
  - Risk Distribution chart (Pie via Recharts)
  - Top Performers table
  - Department Statistics table
  - Recent Activity feed
  - Risk Alerts with acknowledge
- **Freshers tab:**
  - Search + multi-filter (risk, department, skill, status)
  - Fresher cards with progress bars, risk badges
  - Click-through to fresher detail page
- **Agents tab:**
  - Agent metrics cards (status, queue, processed, avg time, success rate)
- **Reports tab:**
  - Generate reports (Individual, Department, Cohort)
  - Department filter for reports
  - Auto-download PDF after generation
  - Report history list with re-download
- **AI Assessment Generator:** Topic + type → `api.assessment.aiGenerate()`
- **User Management (admin only):** Create user form

### 10.18 Fresher Detail (Manager View) — `frontend/src/app/dashboard/manager/fresher/[id]/page.tsx` (227 lines)

- `FresherDetailPage` — Manager's view of a single fresher
- **Sections:**
  - Progress Overview (overall progress %, risk score, workflow progress)
  - Training Status (quiz, coding, assignment, certification with scores)
  - Real-Time Workflow Progress (visual step progress bar)
  - Skills Overview (progress bars with color coding)

---

## 11. Frontend API Service

### `frontend/src/lib/api-service.ts` (514 lines)

**Base URL:** `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'`

```typescript
export const api = {
  assessment: {
    list(token?) → GET /assessments/
    get(id, token?) → GET /assessments/{id}
    getLatestResult(id, token?) → GET /assessments/{id}/latest-result
    aiGenerate(payload, token?) → POST /assessments/ai-generate
  },
  workflow: {
    submit(payload, token?) → POST /workflows/submit
    getStatus(traceId, token?) → GET /workflows/status/{traceId}
    getFresherDashboard(token?) → GET /freshers/me
    getManagerDashboard(token?) → GET /analytics/dashboard
  },
  fresher: {
    getAssessmentEvaluations(fresherId, token?) → GET /freshers/{id}/assessment-evaluations
    getProfile(id, token?) → GET /freshers/{id}/dashboard (with data mapping)
  },
  report: {
    generate(type, token?, filters?) → POST /reports/generate/{type}
    download(id, token?) → GET /reports/{id}/download (returns Blob)
  },
  admin: {
    getStats(token?) → GET /admin/stats
    getUsers(token?) → GET /admin/users
    createUser(payload, token?) → POST /admin/users
    seedData(token?) → POST /admin/seed-data
  },
}
```

Also includes fallback sample data objects for offline/mock operation: `sampleFresherDashboard`, `sampleManagerDashboard`, `sampleAssessmentList`, `sampleQuiz`, `sampleCodeAssessment`, `sampleAssignment`, `sampleResult`.

---

## 12. Frontend Auth Context

### `frontend/src/lib/auth-context.tsx`

**Types:**

```typescript
type UserRole = 'fresher' | 'manager' | 'admin';
type User = { id: number; email: string; first_name: string; last_name: string; role: UserRole; department?: string };
type AuthResult = { success: boolean; user?: User; token?: string; error?: string };
type RegisterPayload = { email: string; password: string; first_name: string; last_name: string; role: UserRole; department?: string };
```

**`AuthProvider` component:**
- State: `user`, `token`, `isLoading`
- Persists to `localStorage` keys: `auth:user`, `auth:token`
- `login(email, password) → AuthResult` — POST to `/auth/login`
- `register(payload) → AuthResult` — POST to `/auth/register`
- `logout()` — Clears state and localStorage
- `isAuthenticated` — derived from `!!user`

**`useAuth()` hook** — returns `AuthContextValue`

---

## 13. Frontend Types & Utilities

### `frontend/src/lib/types.ts`

```typescript
export type AssessmentType = 'quiz' | 'code' | 'assignment';

export interface AssessmentDetail {
  id: string;
  title: string;
  description?: string;
  assessment_type: AssessmentType;
  time_limit_minutes?: number;
  duration_minutes?: number;
  max_score?: number;
  passing_score?: number;
  max_attempts?: number;
  status?: string;
  attempts_allowed?: number;
  attempts_used?: number;
  available_from?: string | null;
  available_until?: string | null;
  is_active?: boolean;
  is_published?: boolean;
  test_cases?: Array<{ id?; input?; expected_output?; output?; hidden?; name?; points? }>;
  questions?: Array<{ id; question; options?; correct_answer?; type? }>;
  prompt?: string;
  due_date?: string | null;
  starter_code?: string;
  instructions?: string;
  language?: string;
}
```

### `frontend/src/lib/utils.ts`

```typescript
export function cn(...inputs: Array<ClassValue | undefined | null | false>): string
// Minimal classNames helper (joins truthy values)

export function getRiskColor(level: string): string
// Returns Tailwind class: text-green-600 | text-amber-600 | text-orange-600 | text-red-600 | text-gray-600
```

---

## 14. Frontend Hooks

### `frontend/src/hooks/useApi.ts` (117 lines)

```typescript
export function useApi<T>(apiFunction, options?): {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  execute: () => Promise<void>;
  setData: (data: T) => void;
}

export function useAuth(): {
  // Legacy mock auth (superseded by auth-context.tsx)
  user: any | null; isLoading: boolean; isAuthenticated: boolean;
  login(email, password); logout();
}

export function useLocalStorage<T>(key, initialValue): [T, (value) => void]
```

---

## 15. Frontend UI Components

### `frontend/src/components/ui/badge.tsx`

```typescript
const Badge: React.FC<BadgeProps>
// Props: variant ("default" | "secondary" | "destructive" | "outline" | "success" | "warning")
// Renders: rounded pill with variant-specific colors
```

### `frontend/src/components/ui/button.tsx`

```typescript
const Button: React.FC<ButtonProps>
// Props: variant ("default" | "destructive" | "outline" | "secondary" | "ghost" | "link"), size ("default" | "sm" | "lg" | "icon")
```

### `frontend/src/components/ui/card.tsx`

```typescript
const Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
// Standard card layout components with consistent styling
```

### `frontend/src/components/ui/progress.tsx`

```typescript
const Progress: React.FC<ProgressProps>
// Props: value, max, variant ("default" | "success" | "warning" | "danger")
// Renders: horizontal progress bar with animated fill
```

---

## 16. Infrastructure & Config Files

### `docker-compose.yml`

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `postgres` | postgres:15 | 5432 | User: maverickai, DB: maverickai_db |
| `mongodb` | mongo:7 | 27017 | Agent memory & logs |
| `ollama` | ollama/ollama:latest | 11434 | GPU reservation |
| `fastapi` | ./backend | 8000 | Depends on postgres, mongodb, ollama |
| `frontend` | ./frontend | 3000 | Depends on fastapi |

**Volumes:** `postgres_data`, `mongo_data`, `ollama_data`

### `frontend/next.config.js` — Next.js configuration

### `frontend/tailwind.config.js` — Tailwind CSS configuration

### `frontend/postcss.config.js` — PostCSS configuration

### `frontend/tsconfig.json` — TypeScript configuration

### `backend/Dockerfile` — Backend container setup

### `frontend/Dockerfile` — Frontend container setup

---

## 17. Dependencies

### Backend — `backend/requirements.txt`

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.104.1 | Web framework |
| uvicorn[standard] | 0.24.0 | ASGI server |
| sqlalchemy | 2.0.23 | ORM |
| psycopg2-binary | 2.9.9 | PostgreSQL driver |
| pydantic | 2.5.2 | Data validation |
| pydantic-settings | 2.1.0 | Settings management |
| python-jose[cryptography] | 3.3.0 | JWT tokens |
| passlib | 1.7.4 | Password hashing |
| bcrypt | 4.1.2 | bcrypt backend |
| python-multipart | 0.0.6 | Form data |
| python-dotenv | 1.0.0 | .env loading |
| requests | 2.31.0 | HTTP client (Ollama, n8n) |
| aiofiles | 23.2.1 | Async file handling |
| jinja2 | 3.1.2 | Templating |
| fpdf2 | 2.7.6 | PDF generation (v1) |
| reportlab | 4.0.7 | PDF generation (v2) |

### Frontend — `frontend/package.json`

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.0.4 | React framework |
| react / react-dom | ^18 | UI library |
| @monaco-editor/react | ^4.7.0 | Code editor |
| @radix-ui/* | various | UI primitives (avatar, dialog, dropdown, label, progress, select, slot, tabs, toast) |
| class-variance-authority | ^0.7.0 | Variant styling |
| clsx | ^2.1.0 | Class merging |
| lucide-react | ^0.309.0 | Icons |
| recharts | ^2.10.4 | Charts |
| tailwind-merge | ^2.2.0 | Tailwind class merging |
| tailwindcss-animate | ^1.0.7 | CSS animations |

---

## File Count Summary

| Category | Files |
|----------|-------|
| Backend Routes | 14 |
| Backend Agents | 8 (7 agents + base) |
| Backend Models | 11 (10 models + __init__) |
| Backend Utils | 3 |
| Backend Core | 3 (llm_client, security, __init__) |
| Backend Schemas | 2 (__init__, auth) |
| Backend API Deps | 2 (__init__, deps) |
| Backend Config/Startup | 3 (config, database, main) |
| Backend Seed | 1 |
| Frontend Pages | 15 |
| Frontend Components | 4 |
| Frontend Lib | 4 (api-service, auth-context, types, utils) |
| Frontend Hooks | 1 |
| Config Files | 8 (docker-compose, Dockerfiles, next.config, tailwind, postcss, tsconfig, package.json, requirements.txt) |
| **Total** | **~76 files** |

---

## Total API Endpoints: ~88

| Route Group | Endpoints |
|-------------|-----------|
| Auth | 3 |
| Freshers | 11 |
| Agents | 6 |
| Assessments | 8 |
| Analytics | 6 |
| Admin | 9 |
| Certifications | 7 |
| Curricula | 3 |
| Reports | 6 |
| Schedules | 7 |
| Premium | 13 |
| Quiz Config | 8 |
| Workflows | 4 |
| **Total** | **~91** |
