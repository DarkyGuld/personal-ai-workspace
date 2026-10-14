import io
import zipfile
from typing import Dict, Any, Tuple

# Libraries verified in Milestone 0:
# reportlab, python-docx, openpyxl, python-pptx
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import docx
import openpyxl
import pptx

class ArtifactGenerator:
    """
    Generates verified documents (PDF, DOCX, XLSX, PPTX, CSV, ZIP)
    suitable for immediate opening, download, and registration into Library.
    """

    @staticmethod
    def generate_pdf(title: str, text_content: str) -> bytes:
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, 750, title)
        c.setFont("Helvetica", 11)
        y = 710
        for line in text_content.split("\n"):
            if y < 50:
                c.showPage()
                y = 750
            c.drawString(50, y, line)
            y -= 18
        c.save()
        return buf.getvalue()

    @staticmethod
    def generate_docx(title: str, text_content: str) -> bytes:
        doc = docx.Document()
        doc.add_heading(title, level=0)
        for line in text_content.split("\n"):
            if line.strip():
                doc.add_paragraph(line)
        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()

    @staticmethod
    def generate_xlsx(sheet_title: str, headers: list, rows: list) -> bytes:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = sheet_title[:30]
        ws.append(headers)
        for row in rows:
            ws.append(row)
        buf = io.BytesIO()
        wb.save(buf)
        return buf.getvalue()

    @staticmethod
    def generate_pptx(title: str, subtitle: str, bullet_points: list) -> bytes:
        prs = pptx.Presentation()
        # Title slide
        title_slide_layout = prs.slide_layouts[0]
        slide = prs.slides.add_slide(title_slide_layout)
        slide.shapes.title.text = title
        slide.placeholders[1].text = subtitle

        # Bullet point slide
        bullet_slide_layout = prs.slide_layouts[1]
        slide2 = prs.slides.add_slide(bullet_slide_layout)
        slide2.shapes.title.text = "Key Findings"
        tf = slide2.placeholders[1].text_frame
        for pt in bullet_points:
            p = tf.add_paragraph()
            p.text = pt
            p.level = 0

        buf = io.BytesIO()
        prs.save(buf)
        return buf.getvalue()

    @staticmethod
    def generate_zip(files_dict: Dict[str, bytes]) -> bytes:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for fname, content in files_dict.items():
                zf.writestr(fname, content)
        return buf.getvalue()
