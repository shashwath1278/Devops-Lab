from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.document_service import fetch_document_content
from app.services.gemini import generate_quiz, GroqStudyError
from app.core.supabase import supabase
import json
import re

router = APIRouter()

class GenerateQuizRequest(BaseModel):
    document_id: str

@router.post("/generate")
async def generate_quiz_endpoint(request: GenerateQuizRequest):
    try:
        # 1. Get document path
        data, count = supabase.table("documents").select("file_path, title").eq("id", request.document_id).execute()
        
        if not data[1]:
            raise HTTPException(status_code=404, detail="Document not found")
            
        document = data[1][0]
        
        # 2. Fetch Content
        content = await fetch_document_content(
            document["file_path"],
            max_chars=4500,
        )
        
        # 3. Generate Quiz
        quiz_json_str = generate_quiz(content)
        
        # 4. Parse JSON
        try:
            # Clean up potential markdown formatting
            clean_json = quiz_json_str.replace("```json", "").replace("```", "").strip()
            # Extract array if wrapped in text
            match = re.search(r'\[.*\]', clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
                
            quiz = json.loads(clean_json)
            return {"title": document["title"], "quiz": quiz}
        except json.JSONDecodeError:
            print(f"Failed to parse quiz JSON: {quiz_json_str[:500]}")
            raise HTTPException(
                status_code=500,
                detail="Failed to parse AI response into a valid quiz.",
            )

    except GroqStudyError as e:
        status = 413 if e.too_large else 502
        raise HTTPException(status_code=status, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
