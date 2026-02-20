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
    
    # Summary Section
    if "summary" in data:
        pdf.set_font('helvetica', 'B', 14)
        pdf.set_text_color(107, 70, 193)
        pdf.cell(0, 10, "EXECUTIVE SUMMARY", ln=True)
        pdf.set_font('helvetica', '', 11)
        pdf.set_text_color(64, 64, 64)
        pdf.multi_cell(0, 7, sanitize_text(str(data["summary"])))
        pdf.ln(10)

    # Highlights Section with better bullets
    if "highlights" in data and isinstance(data["highlights"], list):
        pdf.set_font('helvetica', 'B', 13)
        pdf.set_text_color(107, 70, 193)
        pdf.cell(0, 10, "KEY HIGHLIGHTS", ln=True)
        pdf.ln(2)
        
        pdf.set_font('helvetica', '', 10)
        pdf.set_text_color(50, 50, 50)
        for item in data["highlights"]:
            # Use simple dash bullet
            pdf.set_x(15)
            pdf.cell(5, 6, "-", border=0)  # Simple dash bullet
            pdf.multi_cell(0, 6, sanitize_text(str(item)))
            pdf.ln(1)
        pdf.ln(8)

    # Recommendations Section
    if "recommendations" in data and isinstance(data["recommendations"], list):
        pdf.set_font('helvetica', 'B', 13)
        pdf.set_text_color(107, 70, 193)
        pdf.cell(0, 10, "RECOMMENDATIONS", ln=True)
        pdf.ln(2)
        
        pdf.set_font('helvetica', '', 10)
        pdf.set_text_color(50, 50, 50)
        for i, item in enumerate(data["recommendations"], 1):
            pdf.set_x(15)
            pdf.cell(8, 6, f"{i}.", border=0)
            pdf.multi_cell(0, 6, sanitize_text(str(item)))
            pdf.ln(1)
        pdf.ln(8)

    # Assessment Statistics Table
    if "assessment_stats" in data and isinstance(data["assessment_stats"], list):
        pdf.add_page()
        pdf.set_font('helvetica', 'B', 13)
        pdf.set_text_color(107, 70, 193)
        pdf.cell(0, 10, "ASSESSMENT STATISTICS", ln=True)
        pdf.ln(3)
        
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
            pdf.cell(70, 7, sanitize_text(row.get("title", "N/A")[:30]), 1, 0, 'L')
            pdf.cell(30, 7, sanitize_text(row.get("type", "N/A").upper()), 1, 0, 'C')
            pdf.cell(25, 7, f"{row.get('avg_score', 0):.1f}%", 1, 0, 'C')
            pdf.cell(25, 7, f"{row.get('pass_rate', 0):.1f}%", 1, 0, 'C')
            pdf.cell(30, 7, str(row.get("total_attempts", 0)), 1, 1, 'C')
        pdf.ln(8)

    # Detailed Analysis Section (Dynamic)
    if "detailed_analysis" in data and isinstance(data["detailed_analysis"], dict):
        if "assessment_stats" not in data:
            pdf.add_page()
        pdf.set_font('helvetica', 'B', 13)
        pdf.set_text_color(107, 70, 193)
        pdf.cell(0, 10, "DETAILED ANALYSIS", ln=True)
        pdf.ln(3)
        
        pdf.set_font('helvetica', '', 10)
        pdf.set_text_color(64, 64, 64)
        
        for section, content in data["detailed_analysis"].items():
            # Subsection Header
            pdf.set_font('helvetica', 'B', 11)
            pdf.set_text_color(50, 50, 50)
            pdf.cell(0, 8, sanitize_text(section.replace("_", " ").title()), ln=True)
            
            # Content
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(70, 70, 70)
            
            if isinstance(content, list):
                for item in content:
                    pdf.set_x(15)
                    pdf.cell(5, 5, "-", border=0)  # Simple dash bullet
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

    # Disclaimer
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
