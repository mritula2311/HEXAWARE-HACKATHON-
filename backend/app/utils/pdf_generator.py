import io
import json
from fpdf import FPDF

class MaverickPDF(FPDF):
    def header(self):
        # Branding
        self.set_font('helvetica', 'B', 16)
        self.set_text_color(107, 70, 193) # Purple color
        self.cell(80, 10, 'MAVERICK AI', border=False, align='L')
        
        self.set_font('helvetica', 'I', 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, 'Intelligence Report', border=False, align='R')
        self.ln(5)
        
        # Add a line separator
        self.set_draw_color(107, 70, 193)
        self.set_line_width(0.5)
        self.line(10, 25, 200, 25)
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def sanitize_text(text):
    """Replace incompatible unicode logic."""
    if not isinstance(text, str):
        return str(text)
    replacements = {
        "\u201c": '"', "\u201d": '"', "\u2018": "'", "\u2019": "'",
        "\u2013": "-", "\u2014": "--", "\u2026": "..."
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode('latin-1', 'replace').decode('latin-1')

def _render_section_header(pdf, title):
    """Render a styled section header."""
    pdf.set_font('helvetica', 'B', 13)
    pdf.set_text_color(107, 70, 193)
    pdf.cell(0, 10, sanitize_text(title.upper()), ln=True)
    pdf.ln(2)


def _render_key_value(pdf, key, value):
    """Render a key-value pair."""
    pdf.set_x(15)
    pdf.set_font('helvetica', 'B', 9)
    label = sanitize_text(str(key).replace("_", " ").title() + ":")
    pdf.cell(50, 6, label, border=0)
    pdf.set_font('helvetica', '', 9)
    pdf.set_text_color(70, 70, 70)
    pdf.multi_cell(0, 6, sanitize_text(str(value)))
    pdf.set_text_color(50, 50, 50)


def _render_bullet_list(pdf, items):
    """Render a list as bullet points."""
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(50, 50, 50)
    for item in items:
        if isinstance(item, dict):
            # Render dict items as sub key-value
            for k, v in item.items():
                _render_key_value(pdf, k, v)
        else:
            pdf.set_x(15)
            pdf.cell(5, 6, "-", border=0)
            pdf.multi_cell(0, 6, sanitize_text(str(item)))
            pdf.ln(1)


def _render_numbered_list(pdf, items):
    """Render a numbered list."""
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(50, 50, 50)
    for i, item in enumerate(items, 1):
        pdf.set_x(15)
        pdf.cell(8, 6, f"{i}.", border=0)
        pdf.multi_cell(0, 6, sanitize_text(str(item)))
        pdf.ln(1)


def _render_dict_section(pdf, data, depth=0):
    """Recursively render a dictionary as formatted sections."""
    for key, value in data.items():
        label = key.replace("_", " ").title()
        if isinstance(value, str):
            _render_key_value(pdf, label, value)
        elif isinstance(value, list):
            pdf.set_font('helvetica', 'B', 10)
            pdf.set_text_color(60, 60, 60)
            pdf.set_x(15 + depth * 5)
            pdf.cell(0, 7, sanitize_text(label + ":"), ln=True)
            _render_bullet_list(pdf, value)
            pdf.ln(2)
        elif isinstance(value, dict):
            pdf.set_font('helvetica', 'B', 11)
            pdf.set_text_color(50, 50, 50)
            pdf.set_x(15 + depth * 5)
            pdf.cell(0, 8, sanitize_text(label), ln=True)
            _render_dict_section(pdf, value, depth + 1)
            pdf.ln(2)
        elif value is not None:
            _render_key_value(pdf, label, value)


def _check_page_space(pdf, needed=40):
    """Add a new page if not enough space remaining."""
    if pdf.get_y() > (297 - needed):
        pdf.add_page()


def generate_pdf_report(report_title, content_json):
    if isinstance(content_json, str):
        try:
            data = json.loads(content_json)
        except:
            data = {"summary": content_json}
    else:
        data = content_json

    pdf = MaverickPDF()
    pdf.add_page()
    
    # Title with better formatting
    pdf.set_font('helvetica', 'B', 20)
    pdf.set_text_color(33, 33, 33)
    title_text = sanitize_text(report_title.upper())
    pdf.multi_cell(0, 10, title_text, align='C')
    pdf.ln(8)
    
    # --- Standard report fields ---
    
    # Executive Summary (supports both "summary" and "executive_summary")
    summary_text = data.get("summary") or data.get("executive_summary")
    if summary_text:
        _render_section_header(pdf, "EXECUTIVE SUMMARY")
        pdf.set_font('helvetica', '', 11)
        pdf.set_text_color(64, 64, 64)
        pdf.multi_cell(0, 7, sanitize_text(str(summary_text)))
        pdf.ln(10)

    # Highlights Section
    if "highlights" in data and isinstance(data["highlights"], list):
        _check_page_space(pdf)
        _render_section_header(pdf, "KEY HIGHLIGHTS")
        _render_bullet_list(pdf, data["highlights"])
        pdf.ln(8)

    # Recommendations (standard format)
    recs = data.get("recommendations")
    if isinstance(recs, list):
        _check_page_space(pdf)
        _render_section_header(pdf, "RECOMMENDATIONS")
        _render_numbered_list(pdf, recs)
        pdf.ln(8)

    # Assessment Statistics Table
    if "assessment_stats" in data and isinstance(data["assessment_stats"], list) and data["assessment_stats"]:
        _check_page_space(pdf, 60)
        _render_section_header(pdf, "ASSESSMENT STATISTICS")
        pdf.ln(1)
        
        # Table Header
        pdf.set_font('helvetica', 'B', 9)
        pdf.set_fill_color(240, 240, 245)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(70, 8, "Assessment", 1, 0, 'L', True)
        pdf.cell(30, 8, "Type", 1, 0, 'C', True)
        pdf.cell(25, 8, "Avg Score", 1, 0, 'C', True)
        pdf.cell(25, 8, "Passing", 1, 0, 'C', True)
        pdf.cell(30, 8, "Attempts", 1, 1, 'C', True)
        
        # Table Data
        pdf.set_font('helvetica', '', 8)
        pdf.set_text_color(60, 60, 60)
        for row in data["assessment_stats"]:
            if not isinstance(row, dict):
                continue
            _check_page_space(pdf, 15)
            pdf.cell(70, 7, sanitize_text(row.get("title", "N/A")[:30]), 1, 0, 'L')
            pdf.cell(30, 7, sanitize_text(str(row.get("type", "N/A")).upper()), 1, 0, 'C')
            pdf.cell(25, 7, f"{row.get('avg_score', 0):.1f}%", 1, 0, 'C')
            pdf.cell(25, 7, f"{row.get('pass_rate', 0):.1f}%", 1, 0, 'C')
            pdf.cell(30, 7, str(row.get("total_attempts", 0)), 1, 1, 'C')
        pdf.ln(8)

    # Detailed Analysis Section
    if "detailed_analysis" in data and isinstance(data["detailed_analysis"], dict):
        _check_page_space(pdf)
        _render_section_header(pdf, "DETAILED ANALYSIS")
        pdf.ln(1)
        
        for section, content in data["detailed_analysis"].items():
            _check_page_space(pdf)
            pdf.set_font('helvetica', 'B', 11)
            pdf.set_text_color(50, 50, 50)
            pdf.cell(0, 8, sanitize_text(section.replace("_", " ").title()), ln=True)
            
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(70, 70, 70)
            
            if isinstance(content, list):
                for item in content:
                    pdf.set_x(15)
                    pdf.cell(5, 5, "-", border=0)
                    pdf.multi_cell(0, 5, sanitize_text(str(item)))
                pdf.ln(2)
            elif isinstance(content, dict):
                for k, v in content.items():
                    pdf.set_x(15)
                    pdf.set_font('helvetica', 'B', 9)
                    pdf.cell(45, 5, sanitize_text(f"{k}:"), border=0)
                    pdf.set_font('helvetica', '', 9)
                    pdf.multi_cell(0, 5, sanitize_text(str(v)))
                pdf.ln(2)
            else:
                pdf.set_x(15)
                pdf.multi_cell(0, 5, sanitize_text(str(content)))
                pdf.ln(3)

    # --- Individual HR Report sections ---
    
    # Performance Overview
    perf = data.get("performance_overview")
    if isinstance(perf, dict):
        _check_page_space(pdf)
        _render_section_header(pdf, "PERFORMANCE OVERVIEW")
        _render_dict_section(pdf, perf)
        pdf.ln(6)

    # Technical Competency Assessment
    tech = data.get("technical_competency_assessment")
    if isinstance(tech, dict):
        _check_page_space(pdf)
        _render_section_header(pdf, "TECHNICAL COMPETENCY ASSESSMENT")
        _render_dict_section(pdf, tech)
        pdf.ln(6)

    # Professional Skills Assessment
    prof = data.get("professional_skills_assessment")
    if isinstance(prof, dict):
        _check_page_space(pdf)
        _render_section_header(pdf, "PROFESSIONAL SKILLS ASSESSMENT")
        _render_dict_section(pdf, prof)
        pdf.ln(6)

    # Detailed Assessment Analysis (array of objects)
    daa = data.get("detailed_assessment_analysis")
    if isinstance(daa, list) and daa:
        _check_page_space(pdf)
        _render_section_header(pdf, "DETAILED ASSESSMENT ANALYSIS")
        for entry in daa:
            if isinstance(entry, dict):
                _check_page_space(pdf, 30)
                title = entry.get("assessment", entry.get("title", "Assessment"))
                pdf.set_font('helvetica', 'B', 10)
                pdf.set_text_color(50, 50, 50)
                pdf.set_x(15)
                pdf.cell(0, 7, sanitize_text(str(title)), ln=True)
                for k, v in entry.items():
                    if k in ("assessment", "title"):
                        continue
                    _render_key_value(pdf, k, v)
                pdf.ln(3)
        pdf.ln(4)

    # HR Recommendations
    hr_rec = data.get("hr_recommendations")
    if isinstance(hr_rec, dict):
        _check_page_space(pdf)
        _render_section_header(pdf, "HR RECOMMENDATIONS")
        _render_dict_section(pdf, hr_rec)
        pdf.ln(6)

    # Placement Recommendation
    placement = data.get("placement_recommendation")
    if isinstance(placement, dict):
        _check_page_space(pdf)
        _render_section_header(pdf, "PLACEMENT RECOMMENDATION")
        _render_dict_section(pdf, placement)
        pdf.ln(6)

    # Manager Notes
    mgr_notes = data.get("manager_notes")
    if mgr_notes:
        _check_page_space(pdf)
        _render_section_header(pdf, "MANAGER NOTES")
        pdf.set_font('helvetica', 'I', 10)
        pdf.set_text_color(64, 64, 64)
        pdf.multi_cell(0, 6, sanitize_text(str(mgr_notes)))
        pdf.ln(6)

    # HR Action Items
    hr_actions = data.get("hr_action_items")
    if isinstance(hr_actions, list) and hr_actions:
        _check_page_space(pdf)
        _render_section_header(pdf, "HR ACTION ITEMS")
        _render_numbered_list(pdf, hr_actions)
        pdf.ln(6)

    # --- Catch-all: render any remaining top-level keys not already handled ---
    handled_keys = {
        "summary", "executive_summary", "title", "highlights", "recommendations",
        "assessment_stats", "detailed_analysis", "performance_overview",
        "technical_competency_assessment", "professional_skills_assessment",
        "detailed_assessment_analysis", "hr_recommendations",
        "placement_recommendation", "manager_notes", "hr_action_items",
        "generated_at", "report_type", "statistics", "executive_insights",
        "freshers_performance", "warnings", "fresher_performance_log"
    }
    remaining = {k: v for k, v in data.items() if k not in handled_keys and v}
    
    for key, value in remaining.items():
        _check_page_space(pdf)
        label = key.replace("_", " ").title()
        _render_section_header(pdf, label)
        if isinstance(value, str):
            pdf.set_font('helvetica', '', 10)
            pdf.set_text_color(64, 64, 64)
            pdf.multi_cell(0, 6, sanitize_text(value))
        elif isinstance(value, list):
            _render_bullet_list(pdf, value)
        elif isinstance(value, dict):
            _render_dict_section(pdf, value)
        pdf.ln(6)

    # --- Overall performance report: executive insights + statistics ---
    exec_insights = data.get("executive_insights")
    if isinstance(exec_insights, dict):
        _check_page_space(pdf)
        _render_section_header(pdf, "EXECUTIVE INSIGHTS")
        _render_dict_section(pdf, exec_insights)
        pdf.ln(6)

    stats = data.get("statistics")
    if isinstance(stats, dict):
        _check_page_space(pdf)
        _render_section_header(pdf, "STATISTICS")
        _render_dict_section(pdf, stats)
        pdf.ln(6)

    # Fresher Performance Log Table
    perf_log = data.get("fresher_performance_log") or data.get("freshers_performance")
    if isinstance(perf_log, list) and perf_log:
        _check_page_space(pdf, 60)
        _render_section_header(pdf, "FRESHER PERFORMANCE LOG")
        pdf.ln(1)
        
        # Table Header
        pdf.set_font('helvetica', 'B', 8)
        pdf.set_fill_color(240, 240, 245)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(45, 7, "Name", 1, 0, 'L', True)
        pdf.cell(35, 7, "Department", 1, 0, 'L', True)
        pdf.cell(25, 7, "Progress", 1, 0, 'C', True)
        pdf.cell(25, 7, "Risk", 1, 0, 'C', True)
        pdf.cell(50, 7, "Status", 1, 1, 'L', True)
        
        pdf.set_font('helvetica', '', 7)
        pdf.set_text_color(60, 60, 60)
        for entry in perf_log:
            if not isinstance(entry, dict):
                continue
            _check_page_space(pdf, 15)
            name = entry.get("name", entry.get("fresher_name", "N/A"))
            dept = entry.get("department", "N/A")
            prog = entry.get("progress", entry.get("overall_progress", "N/A"))
            risk = entry.get("risk_level", "N/A")
            status = entry.get("status_comment", entry.get("has_warning", ""))
            pdf.cell(45, 6, sanitize_text(str(name)[:22]), 1, 0, 'L')
            pdf.cell(35, 6, sanitize_text(str(dept)[:18]), 1, 0, 'L')
            pdf.cell(25, 6, sanitize_text(str(prog)), 1, 0, 'C')
            pdf.cell(25, 6, sanitize_text(str(risk)), 1, 0, 'C')
            pdf.cell(50, 6, sanitize_text(str(status)[:25]), 1, 1, 'L')
        pdf.ln(8)

    # Warnings section
    warnings = data.get("warnings")
    if isinstance(warnings, list) and warnings:
        _check_page_space(pdf)
        _render_section_header(pdf, "PERFORMANCE WARNINGS")
        for w in warnings:
            if isinstance(w, dict):
                _check_page_space(pdf, 25)
                name = w.get("fresher_name", "Unknown")
                level = w.get("warning_level", "warning").upper()
                pdf.set_font('helvetica', 'B', 10)
                pdf.set_text_color(180, 30, 30) if level == "CRITICAL" else pdf.set_text_color(200, 130, 0)
                pdf.cell(0, 7, sanitize_text(f"[{level}] {name}"), ln=True)
                pdf.set_text_color(60, 60, 60)
                if "reason" in w:
                    pdf.set_font('helvetica', '', 9)
                    pdf.set_x(15)
                    pdf.multi_cell(0, 5, sanitize_text(str(w["reason"])))
                if "recommendation" in w:
                    pdf.set_font('helvetica', 'I', 8)
                    pdf.set_x(15)
                    pdf.multi_cell(0, 5, sanitize_text(str(w["recommendation"])))
                pdf.ln(3)
        pdf.ln(4)

    # Disclaimer
    _check_page_space(pdf, 25)
    pdf.set_y(-30)
    pdf.set_font('helvetica', 'I', 8)
    pdf.set_text_color(150, 150, 150)
    disclaimer_text = "This report is generated by MaverickAI intelligent agents using internal training data and assessment metrics. All insights, predictions, and scores are based on current available data and should be used as guidance for training improvement decisions."
    pdf.multi_cell(0, 5, sanitize_text(disclaimer_text), align='C')

    # Ensure bytes output (fpdf returns string, fpdf2 returns bytes)
    result = pdf.output()
    if isinstance(result, str):
        return result.encode('latin-1')
    return result
