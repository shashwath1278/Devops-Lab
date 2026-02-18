from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.document_service import fetch_document_content
from app.services.gemini import generate_flashcards
from app.core.supabase import supabase
import json

router = APIRouter()

class GenerateFlashcardsRequest(BaseModel):
    document_id: str

@router.post("/generate")
async def generate_flashcards_endpoint(request: GenerateFlashcardsRequest):
    try:
        # 1. Get document path from DB
        data, count = supabase.table("documents").select("file_path, title").eq("id", request.document_id).execute()
        
        if not data[1]:
            raise HTTPException(status_code=404, detail="Document not found")
            
        document = data[1][0]
        
        # 2. Fetch Content
        content = await fetch_document_content(document["file_path"])
        
        if not content:
            raise HTTPException(status_code=500, detail="Failed to read document content")
            
        # 3. Generate Flashcards
        flashcards_json = generate_flashcards(content)
        
        # 4. Parse JSON
        try:
            # Attempt to find the JSON array in the text
            start_index = flashcards_json.find("[")
            end_index = flashcards_json.rfind("]")
            
            if start_index != -1 and end_index != -1:
                json_str = flashcards_json[start_index : end_index + 1]
                flashcards = json.loads(json_str)
                return {"flashcards": flashcards}
            else:
                raise ValueError("No JSON array found in response")
                
        except (json.JSONDecodeError, ValueError):
            # Fallback if AI returns bad JSON
            print(f"Bad JSON from AI: {flashcards_json}")
            raise HTTPException(status_code=500, detail="AI failed to generate valid flashcards")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
