"""PDF generation utilities for exporting submissions and reports."""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.platypus.tableofcontents import TableOfContents
from io import BytesIO
from datetime import datetime
import json


class PDFGenerator:
    """Generate professional PDF reports for submissions and analytics."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#003366'),
            spaceAfter=30,
            alignment=1  # Center
        )
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#003366'),
            spaceAfter=12,
            spaceBefore=12
        )
    
    def generate_submission_pdf(self, submission_data, fresher_name, assessment_title):
        """Generate PDF for individual submission with feedback."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Header
        story.append(Paragraph("MaverickAI Assessment Report", self.title_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Submission metadata
        meta_data = [
            ["Fresher Name:", fresher_name],
            ["Assessment:", assessment_title],
            ["Generated:", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")],
            ["Type:", submission_data.get('type', 'N/A')],
        ]
        
        meta_table = Table(meta_data, colWidths=[2*inch, 4*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E8F4F8')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Score section
        score = submission_data.get('score', 0)
        max_score = submission_data.get('max_score', 100)
        pass_status = "PASSED" if score >= submission_data.get('passing_score', 60) else "FAILED"
        
        score_data = [
            ["Score", "Max Score", "Percentage", "Status"],
            [str(score), str(max_score), f"{(score/max_score)*100:.1f}%", pass_status],
        ]
        
        score_table = Table(score_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        score_color = colors.HexColor('#4CAF50') if pass_status == "PASSED" else colors.HexColor('#F44336')
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (3, 1), (3, 1), score_color),
            ('TEXTCOLOR', (3, 1), (3, 1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(score_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Feedback section
        feedback = submission_data.get('feedback', {})
        if isinstance(feedback, str):
            feedback = json.loads(feedback)
        
        story.append(Paragraph("Assessment Feedback", self.heading_style))
        
        feedback_text = f"""
        <b>Overall Comment:</b> {feedback.get('overall_comment', 'No comment')}<br/>
        <br/>
        <b>Strengths:</b><br/>
        """ + ("<br/>".join([f"• {s}" for s in feedback.get('strengths', [])]) if feedback.get('strengths') else "None recorded") + """<br/>
        <br/>
        <b>Areas for Improvement:</b><br/>
        """ + ("<br/>".join([f"• {w}" for w in feedback.get('weaknesses', [])]) if feedback.get('weaknesses') else "None recorded") + """<br/>
        <br/>
        <b>Suggestions:</b><br/>
        """ + ("<br/>".join([f"• {s}" for s in feedback.get('suggestions', [])]) if feedback.get('suggestions') else "None recorded") + """<br/>
        <br/>
        <b>Risk Level:</b> {feedback.get('risk_level', 'N/A')}
        """
        
        story.append(Paragraph(feedback_text, self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_performance_report_pdf(self, fresher_data, analytics_data):
        """Generate comprehensive performance report for a fresher."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Title
        story.append(Paragraph("Performance Analytics Report", self.title_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Fresher info
        story.append(Paragraph(f"Name: {fresher_data.get('name', 'N/A')}", self.heading_style))
        story.append(Paragraph(f"Employee ID: {fresher_data.get('employee_id', 'N/A')}", self.styles['Normal']))
        story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}", self.styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Key metrics
        story.append(Paragraph("Key Performance Metrics", self.heading_style))
        metrics_data = [
            ["Metric", "Value"],
            ["Overall Score", f"{analytics_data.get('overall_score', 0):.1f}/100"],
            ["Quiz Average", f"{analytics_data.get('quiz_average', 0):.1f}%"],
            ["Pass Rate", f"{analytics_data.get('pass_rate', 0):.1f}%"],
            ["Assessments Completed", str(analytics_data.get('assessment_count', 0))],
            ["Risk Level", analytics_data.get('risk_level', 'N/A').upper()],
            ["Engagement Score", f"{analytics_data.get('engagement_score', 0):.1f}"],
            ["Cohort Percentile", f"{analytics_data.get('cohort_percentile', 0):.1f}%"],
        ]
        
        metrics_table = Table(metrics_data, colWidths=[3*inch, 2.5*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F0F0F0')]),
        ]))
        story.append(metrics_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Skills breakdown
        story.append(Paragraph("Skills Performance Breakdown", self.heading_style))
        skills = analytics_data.get('skills_breakdown', {})
        if skills:
            skills_data = [["Skill", "Score"]] + [[k, f"{v:.1f}%"] for k, v in skills.items()]
            skills_table = Table(skills_data, colWidths=[3*inch, 2.5*inch])
            skills_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F0F0F0')]),
            ]))
            story.append(skills_table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer


pdf_generator = PDFGenerator()
