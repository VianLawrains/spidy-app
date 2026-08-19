from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import Memory

class MemoryService:
    async def add_memory(self, db: AsyncSession, user_id: str, key: str, value: str, category: str = "preference") -> Memory:
        memory = Memory(user_id=user_id, memory_key=key, memory_value=value, category=category)
        db.add(memory)
        await db.commit()
        await db.refresh(memory)
        return memory

    async def get_user_memories(self, db: AsyncSession, user_id: str) -> List[Memory]:
        result = await db.execute(select(Memory).where(Memory.user_id == user_id))
        return result.scalars().all()

    async def build_context_string(self, db: AsyncSession, user_id: str) -> str:
        memories = await self.get_user_memories(db, user_id)
        if not memories:
            return ""
        
        context_lines = [f"- {m.memory_key}: {m.memory_value}" for m in memories]
        return "\n[Spidy User Memory Context]:\n" + "\n".join(context_lines)

memory_service = MemoryService()
