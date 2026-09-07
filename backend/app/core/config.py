import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

class Settings(BaseSettings):
    PROJECT_NAME: str = "Spidy AI Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = "spidy_super_secret_jwt_key_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 Days
    
    # Transactional Email Providers (Resend / SMTP)
    RESEND_API_KEY: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_FROM_EMAIL: str = ""

    # Google OAuth Credentials
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://spidy-app.onrender.com/api/v1/auth/google/callback"
    FRONTEND_URL: str = "https://spidy-app-phi.vercel.app"

    # SMS / Twilio Provider
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./spidy.db"
    
    # AI Providers
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    HF_TOKEN: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # Storage
    UPLOAD_DIR: str = "uploads"

    class Config:
        case_sensitive = True

def get_settings() -> Settings:
    # Define the search path for .env files
    core_dir = os.path.dirname(os.path.abspath(__file__)) # .../backend/app/core
    app_dir = os.path.dirname(core_dir)                    # .../backend/app
    backend_dir = os.path.dirname(app_dir)                 # .../backend
    root_dir = os.path.dirname(backend_dir)                # .../spidy-app
    
    root_env = os.path.join(root_dir, ".env")
    backend_env = os.path.join(backend_dir, ".env")

    loaded_env_path = None
    
    # 1. spidy-app/.env (preferred)
    if os.path.exists(root_env):
        load_dotenv(root_env)
        loaded_env_path = root_env
    # 2. backend/.env (fallback)
    elif os.path.exists(backend_env):
        load_dotenv(backend_env)
        loaded_env_path = backend_env

    # Create settings object (reads from environment variables populated by load_dotenv)
    settings = Settings()

    # Startup Logging
    if loaded_env_path:
        print(f"Loaded .env: {loaded_env_path}")
    else:
        print("No .env file found, relying on system environment variables.")
        
    key_detected = bool(settings.GEMINI_API_KEY)
    key_length = len(settings.GEMINI_API_KEY.strip()) if settings.GEMINI_API_KEY else 0
    
    print(f"GEMINI_API_KEY detected: {key_detected}")
    print(f"GEMINI_API_KEY length: {key_length}")
    
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    return settings

# Create a global settings instance
settings = get_settings()
