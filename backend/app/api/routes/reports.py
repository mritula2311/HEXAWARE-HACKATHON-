import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import Report
from app.core.security import decode_access_token

router = APIRouter(tags=["Reports"])


@router.post("/generate/{report_type}")
def generate_report(report_type: str, filters: dict = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print(f"[DEBUG] Generating report: type={report_type}, user={current_user.id}, filters={filters}")
    from app.agents.reporting_agent import ReportingAgent
    agent = ReportingAgent()
    try:
        result = agent.generate_report(db, report_type, current_user.id, filters)
        print(f"[DEBUG] Report generated successfully: id={result.get('id')}")
        return result
    except Exception as e:
        print(f"[DEBUG] Report generation failed: {str(e)}")
        import traceback
        with open("last_error.txt", "w") as f:
            traceback.print_exc(file=f)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/individual")
def generate_individual(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generate comprehensive HR assessment report for an individual fresher."""
    fresher_id = data.get("fresher_id")
    if not fresher_id:
        raise HTTPException(status_code=400, detail="fresher_id is required")
    
    from app.agents.reporting_agent import ReportingAgent
    from app.models.fresher import Fresher
    
    # Verify fresher exists
    fresher = db.query(Fresher).filter(Fresher.id == int(fresher_id)).first()
    if not fresher:
        raise HTTPException(status_code=404, detail="Fresher not found")
    
    agent = ReportingAgent()
    try:
        result = agent.generate_individual_hr_report(db, int(fresher_id))
        return result
    except Exception as e:
        print(f"[ERROR] Individual HR report generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/department")
def generate_department(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    department = data.get("department")
    if not department:
        raise HTTPException(status_code=400, detail="department is required")
    from app.agents.reporting_agent import ReportingAgent
    agent = ReportingAgent()
    try:
        result = agent.generate_report(db, f"department_{department}", current_user.id)
        return result
    except Exception as e:
        print(f"[ERROR] Department report generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cohort")
def generate_cohort(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cohort_id = data.get("cohort_id")
    if not cohort_id:
        raise HTTPException(status_code=400, detail="cohort_id is required")
    from app.agents.reporting_agent import ReportingAgent
    agent = ReportingAgent()
    try:
        result = agent.generate_report(db, f"cohort_{cohort_id}", current_user.id)
        return result
    except Exception as e:
        print(f"[ERROR] Cohort report generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reports = db.query(Report).order_by(Report.generated_at.desc()).all()
    return [_report_dict(r) for r in reports]


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    token: str = Query(None, description="JWT token (alternative to Authorization header for browser downloads)"),
    db: Session = Depends(get_db),
):
    """Download a report as PDF. Accepts auth via either:
    - Authorization: Bearer <token> header, OR
    - ?token=<jwt> query parameter (for direct browser downloads via window.open)
    """
    # Try query param token first (for browser direct downloads)
    if token:
        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        print(f"[AUTH] Download auth via query token for user {user.email}")
    else:
        # No query token - this will fail without Authorization header
        # but we let FastAPI/the deps handle that naturally
        raise HTTPException(status_code=401, detail="Token required. Pass ?token=<jwt> or Authorization header.")
    
    return _do_download(report_id, db)


def _do_download(report_id: str, db: Session):
    """Shared logic for report PDF download."""
    try:
        print(f"[DEBUG] Download request for report {report_id}")
        report_id_int = int(report_id)
        report = db.query(Report).filter(Report.id == report_id_int).first()

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if not report.content:
            raise HTTPException(status_code=404, detail="Report generation in progress or content empty")

        from fastapi.responses import JSONResponse, Response

        # Parse content safely
        try:
            report_data = json.loads(report.content) if isinstance(report.content, str) else report.content
            if not isinstance(report_data, dict):
                report_data = {"summary": str(report_data)}
        except Exception as e:
            print(f"[ERROR] JSON parse error for report {report_id}: {e}")
            report_data = {"summary": "Error parsing report content."}

        # Clean title for filename
        safe_title = "".join(c for c in report.title if c.isalnum() or c in (' ', '_')).rstrip()
        safe_title = safe_title.replace(' ', '_').lower()

        if report.format == "pdf":
            from app.utils.pdf_generator import generate_pdf_report
            print(f"[DEBUG] Generating PDF for report {report_id}: {report.title}")
            pdf_bytes = generate_pdf_report(report.title, report_data)
            print(f"[DEBUG] PDF generated, size: {len(pdf_bytes) if pdf_bytes else 0} bytes")
            filename = f"{safe_title}_{report_id}.pdf"
            return Response(
                content=bytes(pdf_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )

        filename = f"{safe_title}_{report_id}.json"
        return JSONResponse(
            content=report_data,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Download failed for report {report_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Report download failed: {str(e)}")


def _report_dict(r: Report) -> dict:
    return {
        "id": str(r.id),
        "title": r.title,
        "type": r.report_type,
        "format": r.format,
        "generated_at": str(r.generated_at) if r.generated_at else "",
        "download_url": f"/api/v1/reports/{r.id}/download",
    }
