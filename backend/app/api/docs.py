import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import User, UploadedFile
from app.core.config import settings
from app.api.auth import get_current_user_optional
from app.services.document_service import document_service

router = APIRouter(prefix="/docs", tags=["Document AI & RAG"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    save_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)
    processed = await document_service.process_document(save_path, file.filename)

    db_file = UploadedFile(
        user_id=current_user.id,
        filename=file.filename,
        file_path=save_path,
        file_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        summary=processed["summary"]
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)

    return {
        "id": db_file.id,
        "filename": db_file.filename,
        "size": db_file.file_size,
        "summary": db_file.summary,
        "preview": processed["text_preview"]
    }

@router.get("/list")
async def list_user_documents(
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UploadedFile).where(UploadedFile.user_id == current_user.id))
    files = result.scalars().all()
    return files
