# MaverickAI n8n Workflows

MaverickAI uses **n8n** as its orchestration "nervous system." These workflows connect the frontend, backend, and various specialized agents.

## Workflow Location
In the reference architecture, n8n workflows are stored internally in the n8n database (service defined in `docker-compose.yml`). For deployment, these are typically imported as JSON files.

---

## 1. Daily Schedule Generation Workflow
**Trigger:** Cron Schedule (Every day at 06:00 AM)
**Responsibility:** Triggers the **Onboarding Agent** to plan the day for all active trainees.

### Workflow Logic:
1.  **Schedule Trigger**: Executes daily.
2.  **Fetch Users (Postgres)**: Retrieves a list of all active Freshers.
3.  **Onboarding Agent Request**: Iterates through users and calls `http://fastapi:8000/api/v1/onboarding/trigger`.
4.  **Save to Database**: The agent's output is written to the `schedules` table.
5.  **Notify User**: Sends a push notification or Slack message.

### Sample JSON structure (n8n compatible):
```json
{
  "nodes": [
    { "parameters": { "rule": { "interval": [ { "field": "hours", "value": 6 } ] } }, "name": "Daily Trigger", "type": "n8n-nodes-base.cron" },
    { "parameters": { "operation": "executeQuery", "query": "SELECT * FROM users WHERE role = 'fresher'" }, "name": "Get Freshers", "type": "n8n-nodes-base.postgres" },
    { "parameters": { "url": "http://fastapi:8000/api/v1/onboarding/generate", "method": "POST" }, "name": "Call Onboarding Agent", "type": "n8n-nodes-base.httpRequest" }
  ],
  "connections": { ... }
}
```

---

## 2. Assessment Assessment & Profile Update
**Trigger:** Webhook (from Frontend/API Gateway)
**Responsibility:** Orchestrates the **Assessment Agent** and **Profile Agent** handoff.

### Workflow Logic:
1.  **Webhook**: Listens for `/submission` events.
2.  **Assessment Agent (FastAPI)**: Grades the code or quiz.
3.  **Profile Agent (FastAPI)**: Updates the skill levels based on the score.
4.  **Analytics Agent**: Predictive check—flags if the user has become "At-Risk."
5.  **Notification**: Sends "Grading Complete" back to the UI via WebSockets.

---

## 3. Weekly Management Report
**Trigger:** Every Friday at 04:00 PM.
**Responsibility:** Calls the **Reporting Agent** to synthesize data for leadership.

### Workflow Logic:
1.  **Reporting Agent**: Generates a PDF summary of cohort performance.
2.  **Email Node**: Sends the PDF to fixed distribution list (e.g., `maverick-leads@company.com`).
