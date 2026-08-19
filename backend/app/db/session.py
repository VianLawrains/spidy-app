import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import inspect, text
from app.core.config import settings

# Parse DATABASE_URL for Production PostgreSQL or Development SQLite
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Configure SQLAlchemy Async Engine
engine_kwargs = {"echo": False, "future": True}

# Add pool pre-ping for remote PostgreSQL connections on Render / Neon
if "postgresql" in db_url:
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        # Import all models to ensure metadata includes all 10 tables
        from app.models import models
        await conn.run_sync(Base.metadata.create_all)

        # Safely migrate schema columns for existing SQLite & PostgreSQL instances
        def migrate_schema(sync_conn):
            inspector = inspect(sync_conn)
            tables = inspector.get_table_names()
            
            # Migrate users table columns if missing
            if "users" in tables:
                user_cols = [c["name"] for c in inspector.get_columns("users")]
                user_cols_to_add = [
                    ("username", "VARCHAR"),
                    ("phone_number", "VARCHAR"),
                    ("is_verified", "BOOLEAN DEFAULT TRUE"),
                    ("otp_code_hash", "VARCHAR"),
                    ("otp_expires_at", "TIMESTAMP"),
                    ("otp_attempts", "INTEGER DEFAULT 0"),
                    ("otp_last_sent_at", "TIMESTAMP"),
                    ("otp_channel", "VARCHAR DEFAULT 'email'"),
                    ("failed_login_attempts", "INTEGER DEFAULT 0"),
                    ("locked_until", "TIMESTAMP"),
                    ("last_login_at", "TIMESTAMP"),
                ]
                for col_name, col_type in user_cols_to_add:
                    if col_name not in user_cols:
                        try:
                            sync_conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                            print(f"Migrated DB: added column users.{col_name}")
                        except Exception as e:
                            print(f"Migration notice for users.{col_name}: {e}")

            # Migrate profiles table columns if missing
            if "profiles" in tables:
                profile_cols = [c["name"] for c in inspector.get_columns("profiles")]
                profile_cols_to_add = [
                    ("bio", "TEXT DEFAULT 'Enterprise Intelligence Suite'"),
                    ("preferred_ai_model", "VARCHAR DEFAULT 'gemini-3.6-flash'"),
                    ("theme", "VARCHAR DEFAULT 'red-dark'"),
                    ("language", "VARCHAR DEFAULT 'en'"),
                    ("notification_settings", "VARCHAR DEFAULT '{\"email\": true, \"push\": true, \"sound\": true}'"),
                    ("created_at", "TIMESTAMP"),
                ]
                for col_name, col_type in profile_cols_to_add:
                    if col_name not in profile_cols:
                        try:
                            sync_conn.execute(text(f"ALTER TABLE profiles ADD COLUMN {col_name} {col_type}"))
                            print(f"Migrated DB: added column profiles.{col_name}")
                        except Exception as e:
                            print(f"Migration notice for profiles.{col_name}: {e}")

        await conn.run_sync(migrate_schema)
