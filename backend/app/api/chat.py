import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.gemini import get_chat_response
from app.core.supabase import supabase
from app.services.document_service import fetch_document_content

router = APIRouter()

MAX_DOC_CONTEXT_CHARS = 4000
_STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "dare",
    "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
    "from", "as", "into", "through", "during", "before", "after", "above",
    "below", "between", "under", "again", "further", "then", "once", "here",
    "there", "when", "where", "why", "how", "all", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "just", "don", "now", "and", "but",
    "or", "if", "because", "until", "while", "about", "against", "what",
    "which", "who", "whom", "this", "that", "these", "those", "am", "i",
    "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    "my", "your", "his", "its", "our", "their", "yes", "no", "ok", "okay",
    "hi", "hello", "hey", "please", "thanks", "thank", "u", "ur", "tell",
    "want", "know", "get", "got", "any", "content", "notes",
}


class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []


class ChatResponse(BaseModel):
    response: str


def _keywords(text: str) -> set[str]:
    tokens = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {t for t in tokens if len(t) > 1 and t not in _STOPWORDS and t != "unit"}


def _unit_numbers(text: str) -> set[str]:
    """e.g. 'unit 3' or 'unit3' -> {'3'}"""
    return set(re.findall(r"unit\s*(\d+)", (text or "").lower()))


def _pick_matching_document(message: str, documents: list) -> Optional[dict]:
    """
    Strict matching: if the user asks for 'unit 2', only a file whose title
    contains 'unit 2' is used — never unit 3/4 or general knowledge.
    """
    if not documents:
        return None

    msg_lower = message.lower()
    msg_units = _unit_numbers(message)

    if msg_units:
        candidates = []
        for doc in documents:
            title = (doc.get("title") or "").lower()
            doc_units = _unit_numbers(title)
            if msg_units & doc_units:
                candidates.append(doc)
        if len(candidates) == 1:
            return candidates[0]
        if len(candidates) > 1:
            return max(candidates, key=lambda d: len(d.get("title") or ""))
        return None

    msg_words = _keywords(message)
    if not msg_words:
        return None

    best_doc = None
    best_score = 0

    for doc in documents:
        title = (doc.get("title") or "").strip()
        if not title:
            continue

        title_lower = title.lower()
        if title_lower in msg_lower:
            return doc

        doc_words = _keywords(title)
        doc_words |= _keywords(doc.get("subject") or "")
        for tag in doc.get("tags") or []:
            doc_words |= _keywords(str(tag))

        overlap = len(msg_words & doc_words)
        if overlap > best_score:
            best_score = overlap
            best_doc = doc

    if best_score >= 2:
        return best_doc

    return None


def _no_match_response(message: str, documents: list) -> str:
    titles = [d.get("title") or "Untitled" for d in documents]
    if titles:
        listed = ", ".join(f'"{t}"' for t in titles)
        return (
            f'I only have notes for: {listed}. There is no uploaded file matching '
            f'"{message}". Please upload that unit or ask about one of the files above. '
            "I cannot answer from other units or general knowledge."
        )
    return (
        "There are no uploaded documents in your library yet. "
        "Upload a PDF first, then ask questions about that file."
    )


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        docs_res = supabase.table("documents").select(
            "title, file_path, subject, tags, description"
        ).execute()
        documents = docs_res.data if docs_res.data else []

        context_text = ""
        matched = _pick_matching_document(request.message, documents)

        if matched:
            print(f"Chat: matched document '{matched['title']}' for message")
            content = await fetch_document_content(
                matched["file_path"],
                max_chars=MAX_DOC_CONTEXT_CHARS,
            )
            if content.strip():
                context_text = (
                    f"\n\n--- Notes file: {matched['title']} ---\n"
                    f"{content}\n--- end of notes excerpt ---\n"
                )
            else:
                print(f"Chat: no extractable text from {matched['file_path']}")
                context_text = (
                    f"\n\n(A file titled '{matched['title']}' is uploaded but "
                    "text could not be extracted — it may be a scanned PDF.)\n"
                )
        else:
            print(f"Chat: no document match for: {request.message!r}")
            return {"response": _no_match_response(request.message, documents)}

        final_message = (
            f'You are answering ONLY about the uploaded file "{matched["title"]}". '
            "STRICT RULES:\n"
            "- Use ONLY the notes excerpt below. Do NOT use training knowledge.\n"
            "- Do NOT describe other units (e.g. unit 2 if only unit 3 is provided).\n"
            "- If the excerpt does not mention what was asked, say it is not in this file.\n"
            f"{context_text}\n\nStudent question: {request.message}"
        )

        groq_history = []
        for msg in request.history[-8:]:
            groq_history.append(
                {
                    "role": "user" if msg.get("role") == "user" else "assistant",
                    "content": msg.get("content", ""),
                }
            )

        response_text = get_chat_response(final_message, history=groq_history)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
