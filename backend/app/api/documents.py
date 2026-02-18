from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
from app.core.supabase import supabase
from app.models.document import Document, DocumentCreate
import shutil
import os

router = APIRouter()

@router.post("/upload", response_model=Document)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    tags: Optional[str] = Form(None), # Comma separated tags
    user_id: str = Form(...) # In a real app, extract from JWT
):
    try:
        # 1. Upload file to Supabase Storage
        file_content = await file.read()
        file_path = f"{user_id}/{file.filename}"
        
        # Check if bucket exists, if not create it (optional, better to assume it exists)
        # res = supabase.storage.create_bucket("textbooks", options={"public": True})

        res = supabase.storage.from_("textbooks").upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        
        # Get Public URL
        public_url = supabase.storage.from_("textbooks").get_public_url(file_path)

        # 2. Save Metadata to DB
        tag_list = [tag.strip() for tag in tags.split(",")] if tags else []
        
        document_data = {
            "title": title,
            "description": description,
            "subject": subject,
            "tags": tag_list,
            "file_url": public_url,
            "file_path": file_path,
            "uploaded_by": user_id
        }

        data, count = supabase.table("documents").insert(document_data).execute()
        
        if not data or len(data[1]) == 0:
             raise HTTPException(status_code=500, detail="Failed to save metadata")

        return data[1][0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[Document])
async def get_documents(
    subject: Optional[str] = None,
    search: Optional[str] = None
):
    query = supabase.table("documents").select("*")
    
    if subject:
        query = query.eq("subject", subject)
    
    if search:
        query = query.ilike("title", f"%{search}%")
        
    data, count = query.execute()
    return data[1]

@router.delete("/{document_id}")
async def delete_document(document_id: str, user_id: str): # user_id should come from auth
    # 1. Get document to find file path
    data, count = supabase.table("documents").select("*").eq("id", document_id).execute()
    if not data[1]:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = data[1][0]
    
    # Verify ownership (simplified)
    # if document["uploaded_by"] != user_id:
    #     raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Delete from Storage
    supabase.storage.from_("textbooks").remove([document["file_path"]])

    # 3. Delete from DB
    supabase.table("documents").delete().eq("id", document_id).execute()

    return {"message": "Document deleted"}
