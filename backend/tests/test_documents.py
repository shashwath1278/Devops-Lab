from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.documents import _normalize_document_row, get_documents, upload_document


def _sample_row(**overrides):
    row = {
        "id": str(uuid4()),
        "title": "Notes",
        "description": "desc",
        "subject": "Math",
        "tags": ["algebra"],
        "file_url": "http://example.com/f.pdf",
        "file_path": "user/f.pdf",
        "uploaded_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    row.update(overrides)
    return row


def test_normalize_document_row_fills_defaults():
    out = _normalize_document_row(_sample_row(tags=None, uploaded_by=""))
    assert out["tags"] == []
    assert out["uploaded_by"] is None


def test_normalize_document_row_preserves_uploaded_by():
    uid = str(uuid4())
    out = _normalize_document_row(_sample_row(uploaded_by=uid))
    assert out["uploaded_by"] == uid


def _mock_supabase_query(rows, *, side_effect=None):
    mock_query = MagicMock()
    if side_effect:
        mock_query.execute.side_effect = side_effect
    else:
        mock_query.execute.return_value = ([None, rows], len(rows))
    mock_query.eq.return_value = mock_query
    mock_query.ilike.return_value = mock_query
    return mock_query


@pytest.mark.asyncio
async def test_get_documents_returns_normalized_rows():
    row = _sample_row()
    mock_query = _mock_supabase_query([row])

    with patch("app.api.documents.supabase") as mock_sb:
        mock_sb.table.return_value.select.return_value = mock_query
        docs = await get_documents()

    assert len(docs) == 1
    assert docs[0].title == "Notes"


@pytest.mark.asyncio
async def test_get_documents_applies_subject_and_search_filters():
    mock_query = _mock_supabase_query([])

    with patch("app.api.documents.supabase") as mock_sb:
        mock_sb.table.return_value.select.return_value = mock_query
        await get_documents(subject="Physics", search="chapter")

    mock_query.eq.assert_called_once_with("subject", "Physics")
    mock_query.ilike.assert_called_once_with("title", "%chapter%")


@pytest.mark.asyncio
async def test_get_documents_skips_invalid_rows():
    good = _sample_row()
    bad = {"id": "bad", "title": "x"}
    mock_query = _mock_supabase_query([good, bad])

    with patch("app.api.documents.supabase") as mock_sb:
        mock_sb.table.return_value.select.return_value = mock_query
        docs = await get_documents()

    assert len(docs) == 1


@pytest.mark.asyncio
async def test_get_documents_raises_http_500_on_db_error():
    mock_query = _mock_supabase_query([], side_effect=RuntimeError("db down"))

    with patch("app.api.documents.supabase") as mock_sb:
        mock_sb.table.return_value.select.return_value = mock_query
        with pytest.raises(HTTPException) as exc:
            await get_documents()

    assert exc.value.status_code == 500
    assert "Failed to load documents" in exc.value.detail


@pytest.mark.asyncio
async def test_upload_document_success():
    row = _sample_row()
    mock_file = MagicMock()
    mock_file.read = AsyncMock(return_value=b"pdf-bytes")
    mock_file.filename = "notes.pdf"
    mock_file.content_type = "application/pdf"

    with patch("app.api.documents.supabase") as mock_sb:
        mock_storage = MagicMock()
        mock_sb.storage.from_.return_value = mock_storage
        mock_storage.upload.return_value = None
        mock_storage.get_public_url.return_value = "http://example.com/notes.pdf"
        mock_sb.table.return_value.insert.return_value.execute.return_value = (
            [None, [row]],
            1,
        )

        doc = await upload_document(
            file=mock_file,
            title="Notes",
            description="desc",
            subject="Math",
            tags="a, b",
            user_id=str(uuid4()),
        )

    assert doc["title"] == "Notes"
    mock_storage.upload.assert_called_once()
