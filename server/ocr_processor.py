"""
MedVault AI - OCR Processor
Extracts text from uploaded PDF/Image medical reports.
Uses Tesseract OCR (100% free, open-source).
Falls back to raw text extraction for PDFs.
"""

import os
import io
from PIL import Image

# Tesseract is optional — gracefully degrade if not installed
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def extract_text_from_image(image_path: str, lang: str = "eng") -> str:
    """
    Extract text from an image file using Tesseract OCR.
    Supports Indian languages: eng, hin (Hindi), tam (Tamil), tel (Telugu).
    """
    if not TESSERACT_AVAILABLE:
        return "[OCR unavailable] Tesseract not installed. Install via: brew install tesseract"

    try:
        image = Image.open(image_path)
        # Preprocess: Convert to grayscale for better OCR
        image = image.convert("L")
        text = pytesseract.image_to_string(image, lang=lang)
        return text.strip()
    except Exception as e:
        return f"[OCR Error] Could not process image: {str(e)}"


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a PDF file.
    Uses basic text extraction; falls back to OCR on image-based PDFs.
    """
    try:
        # Try simple text extraction first (for text-based PDFs)
        import subprocess
        result = subprocess.run(
            ["python3", "-c", f"""
import io
try:
    from PyPDF2 import PdfReader
    reader = PdfReader("{pdf_path}")
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    print(text)
except ImportError:
    print("[PDF reader not available]")
"""],
            capture_output=True, text=True, timeout=30
        )
        text = result.stdout.strip()

        if text and len(text) > 50:
            return text

        # Fallback: If PDF is image-based, try OCR on first page
        if TESSERACT_AVAILABLE:
            try:
                from pdf2image import convert_from_path
                images = convert_from_path(pdf_path, first_page=1, last_page=1)
                if images:
                    return pytesseract.image_to_string(images[0])
            except ImportError:
                pass

        return text if text else "[Could not extract text from PDF]"

    except Exception as e:
        return f"[PDF Error] {str(e)}"


def process_upload(file_path: str) -> str:
    """
    Main entry point: detect file type and extract text accordingly.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"]:
        return extract_text_from_image(file_path)
    elif ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        return f"[Unsupported format] Cannot process {ext} files."


def save_uploaded_file(filename: str, content: bytes) -> str:
    """Save uploaded file to disk and return the path."""
    # Sanitize filename
    safe_name = "".join(c for c in filename if c.isalnum() or c in "._-")
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    return file_path
