import json
from app.agents.base import BaseAgent
from app.models.report import Report
from app.models.fresher import Fresher
from app.models.user import User


class ReportingAgent(BaseAgent):
    """
    The Communicator — generates reports and distributes via email/webhook.
    Enhanced with Corporate HR reporting capabilities for individual and team assessments.
    """

    RECENT_ATTEMPTS_LIMIT = 3  # Only consider the last N quiz attempts per person per assessment

    def __init__(self):
        super().__init__()

    def _get_recent_submissions(self, db, user_id: int = None, assessment_id: int = None, limit: int = None):
        """
        Get only the most recent N submissions per assessment per user.
        This ensures reports reflect current performance, not ancient history.
        """
        from app.models.assessment import Submission, Assessment
        from collections import defaultdict

        n = limit or self.RECENT_ATTEMPTS_LIMIT
        query = db.query(Submission)
        if user_id:
            query = query.filter(Submission.user_id == user_id)
        if assessment_id:
            query = query.filter(Submission.assessment_id == assessment_id)
        query = query.filter(Submission.score != None)
        query = query.order_by(Submission.submitted_at.desc())
        all_subs = query.all()

        # Group by (user_id, assessment_id) and keep only the last N
        grouped = defaultdict(list)
        for s in all_subs:
            key = (s.user_id, s.assessment_id)
            if len(grouped[key]) < n:
                grouped[key].append(s)

        # Flatten back to a list
        recent = []
        for subs in grouped.values():
            recent.extend(subs)
        return recent

    def execute(self, db, **kwargs):
        return self.generate_report(db, "overall")

    def generate_report(self, db, report_type: str, user_id: int = None, filters: dict = None):
        """Generate a professionally styled AI report using deep context."""
        # Query freshers and join with User to get department and details
        query = db.query(Fresher, User).join(User, Fresher.user_id == User.id)
        
        # Apply Filters
        dept_filter = None
        if filters and filters.get("department") and filters.get("department") != "all":
            dept_filter = filters.get("department")
            # Filter by User.department since Fresher doesn't have it
            query = query.filter(User.department == dept_filter)
        
        results = query.all()
        if not results:
            # Fallback to all if filter yields empty (safeguard)
            results = db.query(Fresher, User).join(User, Fresher.user_id == User.id).all()
            dept_filter = None

        freshers = [r[0] for r in results] # List of Fresher objects for backward compat logic if needed
        total = len(results)
        avg_progress = sum((f.overall_progress or 0.0) for f, u in results) / total if total else 0
        at_risk_list = [(f, u) for f, u in results if f.risk_level in ("high", "critical")]
        at_risk_count = len(at_risk_list)
        
        # Detailed Freshers Data
        freshers_details_list = []
        for f, u in results:
            freshers_details_list.append({
                "name": f"{u.first_name} {u.last_name}",
                "employee_id": f.employee_id,
                "department": u.department or "Unassigned",
                "progress": f.overall_progress or 0,
                "risk_level": f.risk_level
            })

        # Group by Department (if not filtered)
        dept_breakdown = {}
        if not dept_filter:
            for f, u in results:
                d = u.department if u.department else "Unassigned"
                
                if d not in dept_breakdown: dept_breakdown[d] = {"count": 0, "avg": 0.0, "risk": 0}
                dept_breakdown[d]["count"] += 1
                dept_breakdown[d]["avg"] += (f.overall_progress or 0.0)
                if f.risk_level in ("high", "critical"): dept_breakdown[d]["risk"] += 1
            
            for d in dept_breakdown:
                if dept_breakdown[d]["count"] > 0:
                    dept_breakdown[d]["avg"] = round(dept_breakdown[d]["avg"] / dept_breakdown[d]["count"], 1)

        # Enhanced Data Gathering based on Report Type
        recent_alerts = []
        skill_summary = {}
        assessment_stats = []

        if report_type == "risk":
            from app.models.report import Alert
            alerts_query = db.query(Alert).filter(Alert.status == "new").order_by(Alert.created_at.desc()).limit(10)
            recent_alerts = [f"{a.fresher_name}: {a.reason} ({a.risk_level})" for a in alerts_query.all()]
        
        if report_type in ("performance", "assessment", "weekly", "overall"):
            from app.models.fresher import Skill
            from app.models.assessment import Assessment, Submission
            from sqlalchemy import func
            
            # Aggregate skills (all available data)
            all_skills = db.query(Skill).all()
            for s in all_skills:
                if s.name not in skill_summary: skill_summary[s.name] = []
                skill_summary[s.name].append(s.level)
            
            # Average out
            skill_summary = {k: round(sum(v)/len(v), 1) for k, v in skill_summary.items()}
            
            # Get Assessment Statistics (only last 3 attempts per person per assessment)
            assessments = db.query(Assessment).filter(Assessment.is_active == True).all()
            for assessment in assessments:
                submissions = self._get_recent_submissions(db, assessment_id=assessment.id)
                
                if submissions:
                    avg_score = sum(s.score for s in submissions) / len(submissions)
                    passing_count = sum(1 for s in submissions if s.score >= assessment.passing_score)
                    pass_rate = (passing_count / len(submissions)) * 100 if submissions else 0
                    
                    assessment_stats.append({
                        "title": assessment.title,
                        "type": assessment.assessment_type,
                        "avg_score": round(avg_score, 1),
                        "pass_rate": round(pass_rate, 1),
                        "total_attempts": len(submissions),
                        "max_score": assessment.max_score,
                        "note": f"Based on last {self.RECENT_ATTEMPTS_LIMIT} attempts per person"
                    })

        # Context construction for LLM
        context = {
            "report_scope": f"Department: {dept_filter}" if dept_filter else "All Departments",
            "report_type": report_type,
            "metrics": {
                "total_freshers": total,
                "average_progress": f"{avg_progress:.1f}%",
                "at_risk_count": at_risk_count,
            },
            "departments": dept_breakdown if not dept_filter else None,
            "risk_details": recent_alerts if report_type == "risk" else [f"{u.first_name} {u.last_name} ({f.risk_level})" for f, u in at_risk_list[:5]],
            "skill_performance": skill_summary if skill_summary else "No skill data available",
            "assessment_statistics": assessment_stats if assessment_stats else "No assessment data",
            "freshers_data": freshers_details_list # Included detailed list
        }

        system_prompt = "You are the MaverickAI Reporting Expert. Transform raw training data into professional, insightful executive reports. Use a formal, data-driven tone. Crucially, include specific names and details of freshers in your analysis."
        
        # Build simpler, clearer prompt
        prompt = f"""Generate a comprehensive {report_type.replace('_', ' ').title()} Intelligence Report as JSON.
The report MUST be detailed and mention specific freshers by name where relevant, especially in the detailed list.
IMPORTANT: Assessment statistics are based ONLY on the last {self.RECENT_ATTEMPTS_LIMIT} attempts per person per quiz to reflect current performance.

DATA:
{json.dumps(context, indent=2)}

Return valid JSON object with these fields:
- title: string
- summary: string (detailed summary with metrics)
- highlights: array of strings (key achievements/stats)
- recommendations: array of strings (actionable steps)
- assessment_stats: array (pass through provided stats)
- fresher_performance_log: array of objects (List ALL freshers from 'freshers_data' with fields: name, department, progress, risk_level, status_comment)
- detailed_analysis: object with keys:
  * risk_analysis: array of strings (mention names of at-risk candidates)
  * skill_gaps: array of strings
  * top_performers: array of strings (mention names of top progress candidates)

Start response with {{ and end with }}. No markdown, just raw JSON."""
        
        print(f"[ReportingAgent] Calling LLM for {report_type} report...")
        response = self.call_llm(prompt, system=system_prompt)
        print(f"[ReportingAgent] LLM Response length: {len(response)} chars")
        
        try:
            # Clean LLM response (robust JSON extraction)
            cleaned_response = response.strip()
            print(f"[ReportingAgent] Response preview: {cleaned_response[:200]}...")
            
            # Remove markdown code blocks if present
            if "```" in cleaned_response:
                import re
                match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned_response, re.DOTALL)
                if match:
                    cleaned_response = match.group(1)
                    print("[ReportingAgent] Extracted JSON from markdown")
            
            # Fallback: Find first { and last }
            if "{" in cleaned_response:
                start = cleaned_response.find("{")
                end = cleaned_response.rfind("}") + 1
                cleaned_response = cleaned_response[start:end]
                print(f"[ReportingAgent] Extracted JSON substring: {start} to {end}")
            
            print(f"[ReportingAgent] Attempting JSON parse...")
            content = json.loads(cleaned_response)
            print(f"[ReportingAgent] JSON parsed successfully")
            
            # Ensure assessment_stats are included
            if assessment_stats and "assessment_stats" not in content:
                content["assessment_stats"] = assessment_stats
                print(f"[ReportingAgent] Added assessment_stats")
            
            # ALWAYS override fresher_performance_log and detailed_analysis with real DB data
            # to prevent LLM from hallucinating names
            content["fresher_performance_log"] = [
                {
                    "name": f["name"],
                    "department": f["department"],
                    "progress": f"{f['progress']}%",
                    "risk_level": f["risk_level"],
                    "status_comment": "At Risk - Needs Attention" if f["risk_level"] in ("high", "critical") else "On Track"
                } for f in freshers_details_list
            ]
            content["detailed_analysis"] = {
                "risk_analysis": [
                    f"{f['name']} ({f['risk_level']})" for f in freshers_details_list if f["risk_level"] in ("high", "critical")
                ] if at_risk_count > 0 else ["No significant risks identified"],
                "skill_gaps": content.get("detailed_analysis", {}).get("skill_gaps", [
                    f"Focus areas: {', '.join(f'{k}' for k, v in list(skill_summary.items())[:3])}" if skill_summary else "Limited data"
                ]) if isinstance(content.get("detailed_analysis"), dict) else [],
                "top_performers": [
                    f"{f['name']} ({f['progress']}%)" for f in sorted(freshers_details_list, key=lambda x: x['progress'], reverse=True)[:3]
                ]
            }
            print(f"[ReportingAgent] Overrode fresher data with real DB names")
                
        except Exception as e:
            print(f"[ReportingAgent] LLM JSON failure: {e}")
            print(f"[ReportingAgent] Raw response: {response[:500]}")
            import traceback
            traceback.print_exc()
            
            # Generate content with actual data
            content = {
                "title": f"MaverickAI {report_type.title()} Analysis Report",
                "summary": f"Analysis of {total} freshers showing {avg_progress:.1f}% average progress. {at_risk_count} candidate(s) identified for support. This report provides comprehensive insights into training effectiveness and skill development across all departments.",
                "highlights": [
                    f"{total} active learners in program",
                    f"Average progress rate: {avg_progress:.1f}%",
                    f"At-risk candidates: {at_risk_count}" if at_risk_count > 0 else "All learners on track",
                    f"Assessments tracked: {len(assessment_stats)}" if assessment_stats else "No assessment data"
                ],
                "recommendations": [
                    f"Implement support plan for {at_risk_count} at-risk fresher(s)" if at_risk_count > 0 else "Maintain current training approach",
                    f"Focus on: {', '.join(list(skill_summary.keys())[:2])}" if skill_summary else "Expand assessment coverage",
                    "Recognize and reward top performers",
                    "Share successful learning practices across teams"
                ],
                "assessment_stats": assessment_stats if assessment_stats else [],
                "fresher_performance_log": [
                    {
                        "name": f["name"],
                        "department": f["department"],
                        "progress": f"{f['progress']}%",
                        "risk_level": f["risk_level"],
                        "status_comment": "At Risk - Needs Attention" if f["risk_level"] in ("high", "critical") else "On Track"
                    } for f in freshers_details_list
                ],
                "detailed_analysis": {
                    "risk_analysis": [
                        f"{f['name']} ({f['risk_level']})" for f in freshers_details_list if f["risk_level"] in ("high", "critical")
                    ] if at_risk_count > 0 else ["No significant risks identified"],
                    "skill_gaps": [
                        f"Focus areas: {', '.join(f'{k}' for k, v in list(skill_summary.items())[:3])}" if skill_summary else "Limited data"
                    ],
                    "top_performers": [
                         f"{f['name']} ({f['progress']}%)" for f in sorted(freshers_details_list, key=lambda x: x['progress'], reverse=True)[:3]
                    ]
                }
            }

        # Store report record
        report = Report(
            title=content.get("title", f"{report_type.title()} Report"),
            report_type=report_type,
            format="pdf",
            generated_by=user_id,
            content=json.dumps(content)
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        
        # Trigger n8n Webhook for Email
        self.send_to_n8n(report, content)

        return {
            "id": str(report.id),
            "title": report.title,
            "type": report.report_type,
            "format": report.format,
            "generated_at": str(report.generated_at) if report.generated_at else "",
            "download_url": f"/api/v1/reports/{report.id}/download",
            "content": content,
            "agent": "ReportingAgent",
        }

    def generate_individual_hr_report(self, db, fresher_id: int):
        """
        Generate comprehensive HR assessment report for an individual fresher.
        Provides professional evaluation suitable for HR records, performance reviews, and career planning.
        """
        from app.models.assessment import Assessment, Submission
        from app.models.fresher import Skill
        
        # Get fresher with user details
        result = db.query(Fresher, User).join(User, Fresher.user_id == User.id).filter(Fresher.id == fresher_id).first()
        if not result:
            return {"error": "Fresher not found"}
        
        fresher, user = result
        
        # Gather only the last 3 assessment submissions per quiz (recent performance)
        recent_sub_ids = {s.id for s in self._get_recent_submissions(db, user_id=user.id)}
        all_submissions = db.query(Submission, Assessment).join(
            Assessment, Submission.assessment_id == Assessment.id
        ).filter(Submission.user_id == user.id).order_by(Submission.submitted_at.desc()).all()
        submissions = [(sub, assess) for sub, assess in all_submissions if sub.id in recent_sub_ids]
        
        # Parse feedback from each submission (last 3 attempts per quiz only)
        assessment_details = []
        for sub, assess in submissions:
            feedback_obj = {}
            if sub.feedback:
                try:
                    feedback_obj = json.loads(sub.feedback)
                except:
                    pass
            
            assessment_details.append({
                "title": assess.title,
                "type": assess.assessment_type,
                "score": sub.score,
                "pass_status": sub.pass_status,
                "submitted_at": str(sub.submitted_at),
                "competency_rating": feedback_obj.get("competency_rating") or feedback_obj.get("technical_competency_rating") or "N/A",
                "overall_assessment": feedback_obj.get("overall_assessment", "No feedback available")[:200]
            })
        
        # Get skills
        skills = db.query(Skill).filter(Skill.fresher_id == fresher_id).all()
        skill_profile = {s.name: s.level for s in skills}
        
        # Calculate overall metrics
        avg_score = sum(sub.score for sub, _ in submissions if sub.score) / len(submissions) if submissions else 0
        pass_rate = sum(1 for sub, _ in submissions if sub.pass_status == "pass") / len(submissions) * 100 if submissions else 0
        
        # Generate HR-style comprehensive report using LLM
        context = {
            "employee_info": {
                "name": f"{user.first_name} {user.last_name}",
                "employee_id": fresher.employee_id,
                "email": user.email,
                "department": user.department or "Unassigned",
                "start_date": str(fresher.join_date) if fresher.join_date else "N/A"
            },
            "training_metrics": {
                "overall_progress": f"{fresher.overall_progress or 0}%",
                "average_assessment_score": f"{avg_score:.1f}%",
                "assessment_pass_rate": f"{pass_rate:.1f}%",
                "total_assessments_completed": len(submissions),
                "risk_level": fresher.risk_level or "low"
            },
            "assessment_history": assessment_details,
            "skill_profile": skill_profile,
            "current_status": {
                "risk_level": fresher.risk_level,
                "notes": "No additional notes"
            }
        }
        
        prompt = f"""You are a Corporate HR Talent Development Manager creating a comprehensive professional assessment report.
NOTE: Assessment data reflects ONLY the last {self.RECENT_ATTEMPTS_LIMIT} attempts per quiz to focus on recent performance trends.

CANDIDATE PROFILE:
{json.dumps(context, indent=2)}

Generate a detailed HR assessment report as JSON with these sections:

{{
  "executive_summary": "Professional 3-4 sentence summary of overall performance, competency, and readiness",
  "performance_overview": {{
    "overall_rating": "Exceptional | Strong Performer | Meets Expectations | Developing | Needs Improvement",
    "key_strengths": ["strength 1", "strength 2", "strength 3"],
    "primary_development_areas": ["area 1", "area 2"],
    "progress_trajectory": "Accelerating | Steady | Inconsistent | Declining"
  }},
  "technical_competency_assessment": {{
    "knowledge_foundation": "Assessment of technical knowledge base",
    "practical_application": "Assessment of ability to apply knowledge",
    "problem_solving": "Assessment of analytical and problem-solving skills",
    "code_quality": "Assessment of technical craftsmanship and standards"
  }},
  "professional_skills_assessment": {{
    "communication": "Assessment of documentation and communication",
    "timeliness": "Assessment of deadline adherence",
    "attention_to_detail": "Assessment of work quality and thoroughness",
    "learning_agility": "Assessment of ability to learn and adapt"
  }},
  "detailed_assessment_analysis": [
    {{
      "assessment": "assessment title",
      "performance": "description of performance",
      "key_takeaways": "what this reveals about candidate"
    }}
  ],
  "hr_recommendations": {{
    "immediate_actions": ["action 1", "action 2"],
    "30_day_development_plan": ["goal 1", "goal 2", "goal 3"],
    "90_day_objectives": ["objective 1", "objective 2"],
    "training_requirements": ["training 1", "training 2"],
    "mentorship_needs": "description of mentorship requirements"
  }},
  "placement_recommendation": {{
    "readiness_for_role": "Ready | Ready with Conditions | Not Ready",
    "suggested_role_level": "Junior | Mid-Level | Senior",
    "team_fit_notes": "Notes on team placement and dynamics",
    "success_probability": "High | Medium | Low",
    "support_requirements": "What support is needed for success"
  }},
  "manager_notes": "Confidential notes for hiring manager and team lead",
  "hr_action_items": ["HR action 1", "HR action 2"]
}}

Be thorough, professional, and constructive. Return ONLY valid JSON."""

        print(f"[ReportingAgent] Generating individual HR report for {fresher.employee_id}")
        
        try:
            response = self.call_llm(prompt, system="You are an experienced Corporate HR Business Partner creating professional talent assessment reports.")
            
            # Parse LLM response
            cleaned = response.strip()
            if "```" in cleaned:
                import re
                match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
                if match:
                    cleaned = match.group(1)
            
            if "{" in cleaned:
                start = cleaned.find("{")
                end = cleaned.rfind("}") + 1
                cleaned = cleaned[start:end]
            
            report_content = json.loads(cleaned)
            
        except Exception as e:
            print(f"[ReportingAgent] HR report generation error: {e}")
            # Fallback report
            report_content = {
                "executive_summary": f"{user.first_name} {user.last_name} has completed {len(submissions)} assessments with an average score of {avg_score:.1f}%. Performance shows {'strong competency' if avg_score >= 80 else 'developing competency' if avg_score >= 60 else 'needs improvement'} in technical areas.",
                "performance_overview": {
                    "overall_rating": "Strong Performer" if avg_score >= 80 else "Meets Expectations" if avg_score >= 70 else "Developing",
                    "key_strengths": ["Consistent effort", "Engagement with training"],
                    "primary_development_areas": ["Technical depth", "Problem-solving efficiency"],
                    "progress_trajectory": "Steady"
                },
                "hr_recommendations": {
                    "immediate_actions": ["Schedule 1:1 review", "Set clear development goals"],
                    "30_day_development_plan": ["Complete assigned training modules", "Practice coding challenges"],
                    "training_requirements": ["Technical skills enhancement"]
                },
                "placement_recommendation": {
                    "readiness_for_role": "Ready with Conditions" if avg_score >= 70 else "Not Ready",
                    "support_requirements": "Standard onboarding with mentorship"
                }
            }
        
        # Store report
        report = Report(
            title=f"HR Assessment Report - {user.first_name} {user.last_name}",
            report_type="individual_hr_assessment",
            format="pdf",
            generated_by=None,
            content=json.dumps(report_content)
        )
        db.add(report)
        db.commit()
        
        return {
            "report_id": report.id,
            "employee_name": f"{user.first_name} {user.last_name}",
            "employee_id": fresher.employee_id,
            "report_type": "HR Assessment Report",
            "generated_at": str(report.generated_at),
            "content": report_content
        }

    def send_to_n8n(self, report, content):
        """Send report content to n8n webhook for emailing."""
        import requests
        import os
        
        # Default n8n internal URL or use configured env var
        webhook_url = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/send-report-email")
        
        try:
            print(f"[ReportingAgent] Sending report {report.id} to n8n: {webhook_url}")
            payload = {
                "report_id": report.id,
                "title": report.title,
                "type": report.report_type,
                "generated_at": str(report.generated_at),
                "summary": content.get("summary", ""),
                "highlights": content.get("highlights", []),
                "recommendations": content.get("recommendations", [])
            }
            # Fire and forget (with short timeout)
            requests.post(webhook_url, json=payload, timeout=2)
        except Exception as e:
            print(f"[ReportingAgent] Failed to trigger n8n webhook: {e}")
    
    def generate_overall_performance_report(self, db):
        """
        Generate comprehensive overall performance report for all freshers with HR insights.
        Includes team metrics, individual standings, warnings, and recommendations.
        """
        from app.models.assessment import Submission, Assessment
        from datetime import datetime
        
        # Get all freshers with user details
        results = db.query(Fresher, User).join(User, Fresher.user_id == User.id).all()
        
        if not results:
            return {
                "error": "No freshers found in the system",
                "report_type": "overall_performance",
                "generated_at": datetime.utcnow().isoformat()
            }
        
        total_freshers = len(results)
        
        # Overall statistics
        avg_progress = sum(f.overall_progress or 0 for f, u in results) / total_freshers
        at_risk = [(f, u) for f, u in results if f.risk_level in ("high", "critical")]
        at_risk_count = len(at_risk)
        
        # Performance standings
        freshers_performance = []
        warnings_list = []
        
        for f, u in results:
            # Get only last 3 submissions per quiz for this fresher
            submissions = self._get_recent_submissions(db, user_id=u.id)
            
            # Check for repeated quiz failures
            warning_info = self.check_repeated_failures(db, f.id)
            
            if warning_info:
                warnings_list.append({
                    "fresher_id": f.id,
                    "fresher_name": f"{u.first_name} {u.last_name}",
                    "employee_id": f.employee_id,
                    "department": u.department or "Unassigned",
                    "warning_level": warning_info["warning_level"],
                    "reason": warning_info["reason"],
                    "failed_count": warning_info["failed_count"],
                    "recommendation": warning_info["recommendation"]
                })
            
            # Calculate individual metrics
            total_submissions = len(submissions)
            passed = sum(1 for s in submissions if s.pass_status == "pass")
            failed = total_submissions - passed
            avg_score = sum(s.score for s in submissions) / total_submissions if total_submissions > 0 else 0
            
            freshers_performance.append({
                "fresher_id": f.id,
                "name": f"{u.first_name} {u.last_name}",
                "employee_id": f.employee_id,
                "department": u.department or "Unassigned",
                "overall_progress": f.overall_progress or 0,
                "risk_level": f.risk_level,
                "risk_score": f.risk_score or 0,
                "total_assessments": total_submissions,
                "passed_assessments": passed,
                "failed_assessments": failed,
                "average_score": round(avg_score, 2),
                "has_warning": bool(warning_info),
                "warning_level": warning_info["warning_level"] if warning_info else None
            })
        
        # Sort by performance (average score descending)
        freshers_performance.sort(key=lambda x: x["average_score"], reverse=True)
        
        # Generate LLM-powered executive summary
        context = {
            "total_freshers": total_freshers,
            "average_progress": round(avg_progress, 2),
            "at_risk_count": at_risk_count,
            "warnings_count": len(warnings_list),
            "top_performers": freshers_performance[:3] if len(freshers_performance) >= 3 else freshers_performance,
            "struggling_performers": [p for p in freshers_performance if p["average_score"] < 60]
        }
        
        prompt = f"""You are a Corporate HR Director reviewing the overall performance of a training cohort.

**Cohort Overview:**
- Total Freshers: {context['total_freshers']}
- Average Progress: {context['average_progress']}%
- At-Risk Count: {context['at_risk_count']}
- Active Warnings: {context['warnings_count']}

**Top Performers:**
{json.dumps(context['top_performers'], indent=2)}

**Struggling Performers Count:** {len(context['struggling_performers'])}

Generate a professional executive summary report with the following structure in JSON format:

{{
    "executive_summary": "3-4 sentence professional overview of cohort performance",
    "key_strengths": ["strength 1", "strength 2", "strength 3"],
    "areas_of_concern": ["concern 1", "concern 2"],
    "cohort_health_rating": "Excellent | Strong | Satisfactory | Needs Attention | Critical",
    "immediate_actions_required": ["action 1", "action 2", "action 3"],
    "talent_retention_outlook": "Overall assessment of talent quality and retention risk",
    "strategic_recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "hr_notes": "Confidential notes for HR leadership"
}}

Use professional corporate HR terminology. Be constructive but honest about performance gaps."""
        
        try:
            llm_response = self.call_llm(prompt)
            # Clean and parse response
            cleaned = llm_response.strip()
            if "```" in cleaned:
                import re
                match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
                if match:
                    cleaned = match.group(1)
            if "{" in cleaned:
                start = cleaned.find("{")
                end = cleaned.rfind("}") + 1
                cleaned = cleaned[start:end]
            llm_insights = json.loads(cleaned)
        except Exception as e:
            print(f"[WARNING] LLM generation failed for overall report: {e}")
            llm_insights = {
                "executive_summary": f"Performance report generated for {total_freshers} freshers. Average progress at {round(avg_progress, 2)}%.",
                "key_strengths": ["Team demonstrates baseline competency"],
                "areas_of_concern": ["Performance monitoring required"],
                "cohort_health_rating": "Satisfactory",
                "immediate_actions_required": ["Continue regular assessments"],
                "talent_retention_outlook": "Monitoring ongoing performance trends",
                "strategic_recommendations": ["Maintain training schedule", "Provide targeted support"],
                "hr_notes": "Standard performance tracking in progress"
            }
        
        # Store report
        report = Report(
            title=f"Overall Cohort Performance Report",
            report_type="overall_performance",
            generated_by=None,
            content=json.dumps({
                "generated_at": datetime.utcnow().isoformat(),
                "report_type": "Overall Cohort Performance Report",
                "statistics": {
                    "total_freshers": total_freshers,
                    "average_progress": round(avg_progress, 2),
                    "at_risk_count": at_risk_count,
                    "warnings_count": len(warnings_list)
                },
                "executive_insights": llm_insights,
                "freshers_performance": freshers_performance,
                "warnings": warnings_list
            })
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "report_id": str(report.id),
            "report_type": "overall_performance",
            "generated_at": datetime.utcnow().isoformat(),
            "statistics": {
                "total_freshers": total_freshers,
                "average_progress": round(avg_progress, 2),
                "at_risk_count": at_risk_count,
                "warnings_count": len(warnings_list)
            },
            "executive_insights": llm_insights,
            "freshers_performance": freshers_performance,
            "warnings": warnings_list
        }
    
    def check_repeated_failures(self, db, fresher_id: int):
        """
        Check if a fresher has failed the same quiz/assessment multiple times.
        Returns warning information if 2-3 consecutive failures detected.
        
        Professional HR Policy:
        - 2 failures: Warning issued with development plan
        - 3+ failures: Critical warning - recommend review for program continuation
        """
        from app.models.assessment import Submission, Assessment
        from app.models.fresher import Fresher
        from app.models.user import User
        
        # Get fresher details
        fresher = db.query(Fresher).filter(Fresher.id == fresher_id).first()
        if not fresher:
            return None
        
        user = db.query(User).filter(User.id == fresher.user_id).first()
        
        # Get all failed quiz submissions
        failed_submissions = db.query(Submission).filter(
            Submission.user_id == user.id,
            Submission.pass_status == "fail",
            Submission.status.in_(["completed", "graded"])
        ).order_by(Submission.submitted_at).all()
        
        if not failed_submissions:
            return None
        
        # Group failures by assessment
        assessment_failures = {}
        for sub in failed_submissions:
            assessment_id = sub.assessment_id
            if assessment_id not in assessment_failures:
                assessment_failures[assessment_id] = []
            assessment_failures[assessment_id].append(sub)
        
        # Check for repeated failures on same assessment
        max_failures = 0
        critical_assessment = None
        
        for assessment_id, failures in assessment_failures.items():
            if len(failures) > max_failures:
                max_failures = len(failures)
                critical_assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        
        if max_failures < 2:
            return None
        
        # Generate professional HR warning
        assessment_title = critical_assessment.title if critical_assessment else "Assessment"
        
        if max_failures == 2:
            warning_level = "warning"
            reason = f"Performance Concern: Failed '{assessment_title}' twice. Immediate intervention and targeted support required to meet program standards."
            recommendation = f"HR Recommendation: Schedule one-on-one review with mentor. Provide additional learning resources for {assessment_title}. Monitor next attempt closely. If third failure occurs, evaluate program fit."
        else:  # 3 or more failures
            warning_level = "critical"
            reason = f"Critical Performance Issue: Failed '{assessment_title}' {max_failures} times. Performance does not meet minimum program requirements despite multiple attempts."
            recommendation = f"HR Recommendation: IMMEDIATE ACTION REQUIRED. Schedule urgent review meeting with HR and program manager. Assess: (1) Skill gap analysis, (2) Learning capability alignment, (3) Program fit evaluation. Consider: Remedial training program, role reassignment, or program termination if performance standards cannot be met."
        
        return {
            "warning_level": warning_level,
            "failed_count": max_failures,
            "assessment_title": assessment_title,
            "assessment_id": critical_assessment.id if critical_assessment else None,
            "reason": reason,
            "recommendation": recommendation,
            "total_failures": len(failed_submissions)
        }
    
    def generate_warnings_report(self, db):
        """
        Generate a dedicated warnings report for admin dashboard.
        Lists all freshers with performance warnings and HR recommendations.
        """
        from app.models.user import User
        from datetime import datetime
        
        # Get all freshers
        results = db.query(Fresher, User).join(User, Fresher.user_id == User.id).all()
        
        warnings = []
        for f, u in results:
            warning_info = self.check_repeated_failures(db, f.id)
            if warning_info:
                warnings.append({
                    "fresher_id": f.id,
                    "fresher_name": f"{u.first_name} {u.last_name}",
                    "employee_id": f.employee_id,
                    "email": u.email,
                    "department": u.department or "Unassigned",
                    "current_week": f.current_week,
                    "overall_progress": f.overall_progress,
                    "risk_level": f.risk_level,
                    "warning_level": warning_info["warning_level"],
                    "failed_count": warning_info["failed_count"],
                    "assessment_title": warning_info["assessment_title"],
                    "reason": warning_info["reason"],
                    "recommendation": warning_info["recommendation"],
                    "total_failures": warning_info["total_failures"]
                })
        
        # Sort by warning level (critical first) then by failed count
        warnings.sort(key=lambda x: (0 if x["warning_level"] == "critical" else 1, -x["failed_count"]))
        
        return {
            "report_type": "performance_warnings",
            "generated_at": datetime.utcnow().isoformat(),
            "total_warnings": len(warnings),
            "critical_warnings": sum(1 for w in warnings if w["warning_level"] == "critical"),
            "standard_warnings": sum(1 for w in warnings if w["warning_level"] == "warning"),
            "warnings": warnings
        }

