from app.core.supabase import supabase
import io
from pypdf import PdfReader

def _best_snippet(text: str, limit: int) -> str:
    """Skip empty PDF headers; take a useful chunk for the LLM."""
    cleaned = text.strip()
    if not cleaned:
        return ""
    if len(cleaned) <= limit:
        return cleaned
    # Large notes PDFs often have blank cover pages — skip a little at the start
    start = min(1500, len(cleaned) // 5) if len(cleaned) > limit * 2 else 0
    return cleaned[start : start + limit]


async def fetch_document_content(file_path: str, max_chars: int = 8000) -> str:
    try:
        response = supabase.storage.from_("textbooks").download(file_path)
        file_content = response

        if file_path.lower().endswith(".pdf"):
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            parts = []
            for page in reader.pages:
                page_text = (page.extract_text() or "").strip()
                if page_text:
                    parts.append(page_text)
            full_text = "\n\n".join(parts)
            return _best_snippet(full_text, max_chars)

        return _best_snippet(file_content.decode("utf-8", errors="ignore"), max_chars)
    except Exception as e:
        print(f"Error fetching document {file_path}: {e}")
        return ""
