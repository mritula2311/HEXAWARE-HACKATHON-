import json
import requests
from typing import Optional
from app.config import settings


class OllamaClient:
    """LLM client that calls Ollama API with automatic mock fallback."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self._available = None

    def is_available(self) -> bool:
        if self._available is not None:
            return self._available
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=2)
            self._available = resp.status_code == 200
        except Exception:
            self._available = False
        return self._available

    def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        system: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        model = model or settings.OLLAMA_MODEL

        if not self.is_available():
            return self._mock_response(prompt)

        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "temperature": temperature,
                "stream": False,
            }
            if system:
                payload["system"] = system

            url = f"{self.base_url}/api/generate"
            
            resp = requests.post(
                url,
                json=payload,
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json().get("response", "")
        except Exception as e:
            print(f"[LLM] Ollama error, using mock: {e}")
            return self._mock_response(prompt)

    def _mock_response(self, prompt: str) -> str:
        prompt_lower = prompt.lower()

        if "report" in prompt_lower:
            return json.dumps({
                "title": "MaverickAI Intelligence Report",
                "summary": "Analysis indicates steady progress across most cohorts. However, specific risk factors have been identified in the Engineering department requiring immediate attention.",
                "highlights": [
                    "85% of freshers on track with training schedule",
                    "Average assessment score: 74/100",
                    "3 freshers flagged as at-risk due to low quiz scores",
                    "Top performing skill area: Python Basics (Avg 82%)"
                ],
                "recommendations": [
                    "Focus remedial support on Data Structures module",
                    "Schedule group mentoring for struggling freshers",
                    "Review coding assessment difficulty calibration"
                ],
                "detailed_analysis": {
                    "Risk Factors": ["Consistent low scores in algorithms", "Missed deadline warnings"],
                    "Skill Gaps": ["Advanced SQL queries", "System Design concepts"],
                    "Top Talent": ["Riya Sharma (98% avg)", "Rahul Kumar (95% avg code quality)"]
                }
            })

        if "schedule" in prompt_lower or "plan" in prompt_lower:
            return json.dumps({
                "tasks": [
                    {"time": "09:00", "title": "Python Fundamentals - Variables & Data Types", "type": "reading", "duration": 60},
                    {"time": "10:00", "title": "Practice: Variable Assignments", "type": "coding", "duration": 45},
                    {"time": "11:00", "title": "Quiz: Python Basics", "type": "quiz", "duration": 30},
                    {"time": "11:30", "title": "Video: Control Flow in Python", "type": "video", "duration": 45},
                    {"time": "13:00", "title": "Coding Challenge: FizzBuzz", "type": "coding", "duration": 60},
                    {"time": "14:00", "title": "Data Structures - Lists & Tuples", "type": "reading", "duration": 60},
                    {"time": "15:00", "title": "Project: Build a Contact Manager", "type": "project", "duration": 90},
                ]
            })

        if "review" in prompt_lower or "code" in prompt_lower or "grade" in prompt_lower:
            return json.dumps({
                "score": 78,
                "overall_comment": "Good implementation with correct logic. Some improvements possible in code style and efficiency.",
                "strengths": [
                    "Correct algorithm implementation",
                    "Good variable naming conventions",
                    "Proper use of functions"
                ],
                "weaknesses": [
                    "Could use list comprehension for cleaner code",
                    "Missing edge case handling for empty inputs",
                    "No docstrings or comments"
                ],
                "suggestions": [
                    "Add type hints for better readability",
                    "Consider using enumerate() instead of range(len())",
                    "Add error handling with try/except blocks"
                ],
                "missing_points": [
                    "Edge-case handling",
                    "Input validation"
                ],
                "errors": [
                    "Fails when input is empty",
                    "Does not handle non-integer inputs"
                ],
                "improvements": [
                    "Handle empty inputs explicitly",
                    "Validate input types before processing"
                ],
                "style_score": 72
            })

        if "risk" in prompt_lower or "analytics" in prompt_lower:
            return json.dumps({
                "risk_level": "medium",
                "risk_score": 45,
                "factors": [
                    "Assessment scores trending downward",
                    "Below cohort average in 2 skill areas",
                    "Engagement metrics within acceptable range"
                ],
                "recommendations": [
                    "Schedule mentoring session for weak areas",
                    "Assign additional practice problems",
                    "Monitor progress over next week"
                ]
            })

        if "quiz" in prompt_lower:
            return json.dumps({
                "overall_comment": "Good attempt on the quiz. You have a solid grasp of the basics, but review some specific details.",
                "strengths": ["Quick response time", "Accurate on fundamentals"],
                "weaknesses": ["Missed some edge-case questions", "Could improve on syntax specifics"],
                "suggestions": ["Re-read the module on Python operators", "Practice more on data types"],
                "missing_points": ["Operator precedence", "Data type conversions"],
                "errors": ["Incorrect assumption about type coercion"],
                "improvements": ["Review operator tables", "Do 10-minute daily quizzes"]
            })

        return json.dumps({
            "response": "Task processed successfully by the AI agent.",
            "status": "completed"
        })


# Singleton instance
llm_client = OllamaClient()
