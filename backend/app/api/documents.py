from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
from app.core.supabase import supabase
from app.core.security import get_current_user_id
from app.models.document import Document

router = APIRouter()


def _normalize_document_row(row: dict) -> dict:
    """Coerce Supabase rows so response validation matches the schema."""
    out = dict(row)
    if out.get("tags") is None:
        out["tags"] = []
    if not out.get("uploaded_by"):
        out["uploaded_by"] = None
    return out


@router.post(
    "/upload",
    response_model=Document,
    responses={500: {"description": "Upload or storage failure"}},
)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
):
    try:
        file_content = await file.read()
        file_path = f"{user_id}/{file.filename}"

        supabase.storage.from_("textbooks").upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type},
        )

        public_url = supabase.storage.from_("textbooks").get_public_url(file_path)
        tag_list = [tag.strip() for tag in tags.split(",")] if tags else []

        document_data = {
            "title": title,
            "description": description,
            "subject": subject,
            "tags": tag_list,
            "file_url": public_url,
            "file_path": file_path,
            "uploaded_by": user_id,
        }

        data, count = supabase.table("documents").insert(document_data).execute()

        if not data or len(data[1]) == 0:
            raise HTTPException(status_code=500, detail="Failed to save metadata")

        return _normalize_document_row(data[1][0])

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/",
    response_model=List[Document],
    responses={500: {"description": "Failed to load documents from database"}},
)
async def get_documents(
    subject: Optional[str] = None,
    search: Optional[str] = None,
):
    try:
        query = supabase.table("documents").select("*")

        if subject:
            query = query.eq("subject", subject)

        if search:
            query = query.ilike("title", f"%{search}%")

        data, count = query.execute()
        rows = data[1] if data and len(data) > 1 else []
        documents = []
        for row in rows:
            try:
                documents.append(Document(**_normalize_document_row(row)))
            except Exception as row_err:
                print(f"Skipping document row {row.get('id')}: {row_err}")
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load documents: {e}",
        ) from e


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
):
    data, count = supabase.table("documents").select("*").eq("id", document_id).execute()
    if not data[1]:
        raise HTTPException(status_code=404, detail="Document not found")

    document = data[1][0]

    owner = document.get("uploaded_by")
    if owner is not None and str(owner) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    supabase.storage.from_("textbooks").remove([document["file_path"]])
    supabase.table("documents").delete().eq("id", document_id).execute()

    return {"message": "Document deleted"}
