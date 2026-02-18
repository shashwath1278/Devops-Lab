from app.core.supabase import supabase
import io
from pypdf import PdfReader

async def fetch_document_content(file_path: str) -> str:
    try:
        # Use Supabase Storage directly to download the file
        # This avoids URL encoding issues with httpx
        response = supabase.storage.from_("textbooks").download(file_path)
        
        # response is bytes
        file_content = response
        
        # Check if PDF based on extension (simple check)
        if file_path.lower().endswith(".pdf"):
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        else:
            # Assume text/markdown
            return file_content.decode("utf-8")
    except Exception as e:
        print(f"Error fetching document: {e}")
        return ""
