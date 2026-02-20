import json
from app.agents.base import BaseAgent
from app.models.report import Report
from app.models.fresher import Fresher
from app.models.user import User


class ReportingAgent(BaseAgent):
    """The Communicator — generates reports and distributes via email/webhook."""

    def __init__(self):
        super().__init__()

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
            
            # Get Assessment Statistics
            assessments = db.query(Assessment).filter(Assessment.is_active == True).all()
            for assessment in assessments:
                submissions = db.query(Submission).filter(
                    Submission.assessment_id == assessment.id,
                    Submission.score != None
                ).all()
                
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
                        "max_score": assessment.max_score
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
            
            # Ensure detailed_analysis has required keys
            if "detailed_analysis" not in content or not isinstance(content.get("detailed_analysis"), dict):
                content["detailed_analysis"] = {
                    "risk_analysis": [f"{at_risk_count} fresher(s) identified for support"] if at_risk_count > 0 else ["No high-risk candidates"],
                    "skill_gaps": [f"Review skill data: {list(skill_summary.keys())[:3]}" if skill_summary else "Expand assessments"],
                    "top_performers": [f"Top performers among {total} freshers"]
                }
                print(f"[ReportingAgent] Generated default detailed_analysis")
                
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
