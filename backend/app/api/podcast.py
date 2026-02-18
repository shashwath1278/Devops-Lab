from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.document_service import fetch_document_content
from app.services.gemini import generate_podcast_script
from app.services.sarvam import generate_audio
from app.core.supabase import supabase
import base64

router = APIRouter()

class GeneratePodcastRequest(BaseModel):
    document_id: str

@router.post("/generate")
async def generate_podcast_endpoint(request: GeneratePodcastRequest):
    try:
        # 1. Get document path
        data, count = supabase.table("documents").select("file_path, title").eq("id", request.document_id).execute()
        
        if not data[1]:
            raise HTTPException(status_code=404, detail="Document not found")
            
        document = data[1][0]
        
        # 2. Fetch Content
        content = await fetch_document_content(document["file_path"])
        
        if not content:
            raise HTTPException(status_code=500, detail="Failed to read document content")
            
        # 3. Generate Script
        script = generate_podcast_script(content)
        
        if not script or "Error" in script:
             raise HTTPException(status_code=500, detail=f"Failed to generate script: {script}")

        # 4. Generate Audio (Optional for now if key missing)
        # Removed the 500 char limit to generate full audio
        audio_bytes = await generate_audio(script)
        
        audio_base64 = None
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
        return {
            "title": document["title"],
            "script": script,
            "audio_base64": audio_base64,
            "message": "Audio generation skipped (Key missing)" if not audio_base64 else "Success"
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
