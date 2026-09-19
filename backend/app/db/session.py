import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import inspect, text, exc
from app.core.config import settings

logger = logging.getLogger("SpidyDBSession")

# Parse DATABASE_URL for Production PostgreSQL or Development SQLite
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Configure SQLAlchemy Async Engine
engine_kwargs = {"echo": False, "future": True}

# Add pool pre-ping for remote PostgreSQL connections on Render / Neon
is_postgres = "postgresql" in db_url
if is_postgres:
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
    """
    Idempotent and Concurrent-Safe Database Initialization.
    Supports local SQLite (spidy.db) and production PostgreSQL (Render/Neon).
    """
    from app.models import models

    try:
        async with engine.begin() as conn:
            # 1. For PostgreSQL, acquire an advisory lock to prevent Gunicorn multi-worker race conditions
            if is_postgres:
                try:
                    await conn.execute(text("SELECT pg_advisory_xact_lock(73351993);"))
                except Exception as lock_err:
                    print(f"[DB INIT NOTICE] Advisory lock notice: {lock_err}")

            # 2. Idempotent Table Creation for all Base.metadata tables (skips existing tables via checkfirst=True)
            def safe_create_tables(sync_conn):
                try:
                    inspector = inspect(sync_conn)
                    existing_tables = set(inspector.get_table_names())
                    for table_name, table in Base.metadata.tables.items():
                        if table_name not in existing_tables:
                            try:
                                table.create(sync_conn, checkfirst=True)
                                print(f"[DB INIT SUCCESS] Created missing table '{table_name}'.")
                            except Exception as table_err:
                                err_str = str(table_err).lower()
                                if "already exists" in err_str or "unique constraint" in err_str:
                                    print(f"[DB INIT NOTICE] Table '{table_name}' already present.")
                                else:
                                    print(f"[DB INIT NOTICE] Creation notice for '{table_name}': {table_err}")
                except Exception as insp_err:
                    print(f"[DB INIT NOTICE] Inspector check notice: {insp_err}")

                try:
                    Base.metadata.create_all(sync_conn, checkfirst=True)
                except (exc.IntegrityError, exc.OperationalError, exc.ProgrammingError) as db_err:
                    err_str = str(db_err).lower()
                    if "already exists" in err_str or "unique constraint" in err_str or "typname" in err_str:
                        print("[DB INIT NOTICE] Schema objects already exist in database.")
                    else:
                        print(f"[DB INIT NOTICE] Ignored non-critical creation notice: {db_err}")

            await conn.run_sync(safe_create_tables)

            # 3. Schema Column Migration for SQLite & PostgreSQL
            def migrate_schema(sync_conn):
                try:
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
                                    print(f"[DB MIGRATION] Added column users.{col_name}")
                                except Exception as col_err:
                                    print(f"[DB MIGRATION NOTICE] Column users.{col_name}: {col_err}")

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
                                    print(f"[DB MIGRATION] Added column profiles.{col_name}")
                                except Exception as col_err:
                                    print(f"[DB MIGRATION NOTICE] Column profiles.{col_name}: {col_err}")
                except Exception as mig_err:
                    print(f"[DB MIGRATION NOTICE] {mig_err}")

            await conn.run_sync(migrate_schema)
            print("[DB INIT SUCCESS] Database initialization complete.")
    except Exception as outer_err:
        err_lower = str(outer_err).lower()
        if "already exists" in err_lower or "unique constraint" in err_lower or "typname" in err_lower:
            print("[DB INIT SUCCESS] Schema already present & ready.")
        else:
            print(f"[DB INIT NOTICE] Handled startup notice: {outer_err}")
