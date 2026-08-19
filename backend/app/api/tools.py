from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import ToolRequest
from app.api.auth import get_current_user_optional
from app.services.tools_service import tools_service

router = APIRouter(prefix="/tools", tags=["AI Productivity Tools"])

@router.post("/process")
async def process_tool(
    req: ToolRequest,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    result = await tools_service.process_tool(
        tool_type=req.tool_type,
        input_text=req.input_text,
        extra_params=req.extra_params
    )
    return {
        "tool_type": req.tool_type,
        "result": result
    }
