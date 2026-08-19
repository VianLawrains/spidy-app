import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import User, GeneratedImage
from app.core.config import settings
from app.api.auth import get_current_user_optional
from app.services.image_service import image_service

router = APIRouter(prefix="/images", tags=["Image AI & Vision Studio"])

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_optional)
):
    save_path = os.path.join(settings.UPLOAD_DIR, f"img_{current_user.id}_{file.filename}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis = await image_service.analyze_image(save_path, file.filename)
    return analysis

@router.post("/generate")
async def generate_image(
    prompt: str = Form(...),
    aspect_ratio: str = Form("1:1"),
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    img_url = await image_service.generate_image(prompt, aspect_ratio)
    db_img = GeneratedImage(
        user_id=current_user.id,
        prompt=prompt,
        image_url=img_url,
        aspect_ratio=aspect_ratio
    )
    db.add(db_img)
    await db.commit()
    await db.refresh(db_img)

    return {
        "id": db_img.id,
        "prompt": db_img.prompt,
        "image_url": db_img.image_url,
        "created_at": db_img.created_at
    }

@router.get("/gallery")
async def get_image_gallery(
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(GeneratedImage).where(GeneratedImage.user_id == current_user.id))
    images = result.scalars().all()
    return images
