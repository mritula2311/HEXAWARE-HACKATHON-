import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import Report

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
    fresher_id = data.get("fresher_id")
    from app.agents.reporting_agent import ReportingAgent
    agent = ReportingAgent()
    # In a real app, generate_report would take fresher_id
    result = agent.generate_report(db, f"individual_{fresher_id}", current_user.id)
    return result


@router.post("/department")
def generate_department(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    department = data.get("department")
    from app.agents.reporting_agent import ReportingAgent
    agent = ReportingAgent()
    result = agent.generate_report(db, f"department_{department}", current_user.id)
    return result


@router.post("/cohort")
def generate_cohort(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cohort_id = data.get("cohort_id")
    from app.agents.reporting_agent import ReportingAgent
    agent = ReportingAgent()
    result = agent.generate_report(db, f"cohort_{cohort_id}", current_user.id)
    return result


@router.get("")
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reports = db.query(Report).order_by(Report.generated_at.desc()).all()
    return [_report_dict(r) for r in reports]


@router.get("/{report_id}/download")
def download_report(report_id: str, db: Session = Depends(get_db)):
    try:
        print(f"[DEBUG] Download request for report {report_id}")
        report_id_int = int(report_id)
        report = db.query(Report).filter(Report.id == report_id_int).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if not report.content:
            return {"message": "Report generation in progress or content empty"}
        
        from fastapi.responses import JSONResponse, Response
        import json
        
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
            # Pass dictionary, not string
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
    except Exception as e:
        print(f"[ERROR] Download failed for report {report_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


def _report_dict(r: Report) -> dict:
    return {
        "id": str(r.id),
        "title": r.title,
        "type": r.report_type,
        "format": r.format,
        "generated_at": str(r.generated_at) if r.generated_at else "",
        "download_url": f"/api/v1/reports/{r.id}/download",
    }
