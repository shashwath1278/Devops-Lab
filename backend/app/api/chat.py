from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.services.gemini import get_chat_response
from app.core.supabase import supabase


router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = [] # [{"role": "user", "content": "msg"}, ...]

class ChatResponse(BaseModel):
    response: str

from app.services.document_service import fetch_document_content

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # 1. Check for document mentions
        # Get all documents to check titles (Optimization: could use text search in DB)
        # For now, fetch all metadata and check in python (simple for small # of docs)
        docs_res = supabase.table("documents").select("title, file_path").execute()
        documents = docs_res.data if docs_res.data else []
        
        context_text = ""
        
        for doc in documents:
            if doc["title"].lower() in request.message.lower():
                print(f"Found document mention: {doc['title']}")
                content = await fetch_document_content(doc["file_path"])
                if content:
                    context_text += f"\n\n--- Document Content: {doc['title']} ---\n{content[:10000]}...\n(Truncated)\n-----------------------------------\n"

        # 2. Prepare Message with Context
        final_message = request.message
        if context_text:
            final_message = f"Context from uploaded documents:{context_text}\n\nUser Question: {request.message}"

        # 3. Transform history to OpenAI/Groq format
        groq_history = []
        for msg in request.history:
             groq_history.append({
                 "role": "user" if msg["role"] == "user" else "assistant",
                 "content": msg["content"]
             })

        response_text = get_chat_response(final_message, history=groq_history)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
