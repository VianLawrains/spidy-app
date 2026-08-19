from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.models import User, Chat, Message
from app.schemas.schemas import ChatOut, ChatCreate, ChatMessageRequest, MessageOut
from app.api.auth import get_current_user_optional
from app.services.llm_router import llm_router
from app.services.memory_service import memory_service

router = APIRouter(prefix="/chat", tags=["Chat Engine"])

def format_chat_dto(chat: Chat) -> ChatOut:
    """Safely format Chat ORM object to ChatOut DTO with loaded messages"""
    msg_list = []
    if hasattr(chat, "messages") and chat.messages is not None:
        try:
            msg_list = [MessageOut.model_validate(m) for m in chat.messages]
        except Exception:
            msg_list = []
            
    return ChatOut(
        id=chat.id,
        user_id=chat.user_id,
        title=chat.title or "New Conversation",
        is_pinned=chat.is_pinned or False,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        messages=msg_list
    )

@router.get("/conversations", response_model=List[ChatOut])
async def list_chats(current_user: User = Depends(get_current_user_optional), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Chat)
        .where(Chat.user_id == current_user.id)
        .options(selectinload(Chat.messages))
        .order_by(Chat.is_pinned.desc(), Chat.updated_at.desc())
    )
    chats = result.scalars().all()
    return [format_chat_dto(c) for c in chats]

@router.post("/conversations", response_model=ChatOut)
async def create_chat(chat_in: ChatCreate, current_user: User = Depends(get_current_user_optional), db: AsyncSession = Depends(get_db)):
    new_chat = Chat(user_id=current_user.id, title=chat_in.title or "New Conversation")
    db.add(new_chat)
    await db.commit()
    
    # Reload chat with messages eagerly loaded
    result = await db.execute(
        select(Chat)
        .where(Chat.id == new_chat.id)
        .options(selectinload(Chat.messages))
    )
    loaded_chat = result.scalars().first()
    return format_chat_dto(loaded_chat)

@router.get("/conversations/{chat_id}", response_model=ChatOut)
async def get_chat(chat_id: str, current_user: User = Depends(get_current_user_optional), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Chat)
        .where(Chat.id == chat_id, Chat.user_id == current_user.id)
        .options(selectinload(Chat.messages))
    )
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return format_chat_dto(chat)

@router.put("/conversations/{chat_id}/pin")
async def toggle_pin_chat(chat_id: str, current_user: User = Depends(get_current_user_optional), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id))
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Conversation not found")
    chat.is_pinned = not chat.is_pinned
    await db.commit()
    return {"status": "success", "is_pinned": chat.is_pinned}

@router.delete("/conversations/{chat_id}")
async def delete_chat(chat_id: str, current_user: User = Depends(get_current_user_optional), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id))
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(chat)
    await db.commit()
    return {"status": "success", "deleted_chat_id": chat_id}

@router.post("/message")
async def send_message(req: ChatMessageRequest, current_user: User = Depends(get_current_user_optional), db: AsyncSession = Depends(get_db)):
    # Find or create chat in DB
    chat = None
    if req.chat_id and not req.chat_id.startswith("temp_"):
        result = await db.execute(
            select(Chat)
            .where(Chat.id == req.chat_id, Chat.user_id == current_user.id)
            .options(selectinload(Chat.messages))
        )
        chat = result.scalars().first()
    
    if not chat:
        chat = Chat(user_id=current_user.id, title=req.message[:35] + "...")
        db.add(chat)
        await db.commit()
        
        # Reload with selectinload
        res = await db.execute(
            select(Chat)
            .where(Chat.id == chat.id)
            .options(selectinload(Chat.messages))
        )
        chat = res.scalars().first()

    # Save user message to DB
    user_msg = Message(chat_id=chat.id, role="user", content=req.message)
    db.add(user_msg)
    await db.commit()

    # Retrieve conversation history & user long-term memories
    result = await db.execute(
        select(Message).where(Message.chat_id == chat.id).order_by(Message.created_at)
    )
    history_messages = result.scalars().all()
    llm_history = [{"role": m.role, "content": m.content} for m in history_messages]

    memory_context = await memory_service.build_context_string(db, current_user.id)

    # Generate real AI response with memory context & selected model
    ai_text = await llm_router.generate_response(
        messages=llm_history,
        model=req.model or "gemini-flash",
        memory_context=memory_context
    )

    # Save assistant message to DB
    ai_msg = Message(chat_id=chat.id, role="assistant", content=ai_text)
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)

    return {
        "chat_id": chat.id,
        "user_message": MessageOut.model_validate(user_msg),
        "assistant_message": MessageOut.model_validate(ai_msg)
    }
