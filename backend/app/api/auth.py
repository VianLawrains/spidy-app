import os
import shutil
import secrets
from datetime import datetime, timedelta
from typing import Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import User, Profile, RefreshToken, LoginAttempt
from app.schemas.schemas import (
    UserRegister,
    UserLogin,
    VerifyOTPRequest,
    ResendOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
    TokenOut,
    UserOut,
    ProfileOut,
    ProfileUpdate
)
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    normalize_email,
    validate_full_name,
    validate_username,
    validate_password_strength,
    hash_otp
)
from app.services.email_service import email_service
from app.core.config import settings
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(tags=["Authentication & Users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Strict authenticated user requirement"""
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated. Please log in.")
    
    payload = decode_token(token)
    if not payload or "sub" not in payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")
    
    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or not found")
    return user

async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Optional user authentication: returns authenticated user or guest user"""
    if token:
        payload = decode_token(token)
        if payload and "sub" in payload and payload.get("type") == "access":
            user_id = payload["sub"]
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()
            if user:
                return user

    # Guest user session fallback
    guest_result = await db.execute(select(User).where(User.id == "guest_user"))
    guest_user = guest_result.scalars().first()
    if not guest_user:
        guest_user = User(
            id="guest_user",
            email="guest@spidy.ai",
            username="guest_spidy",
            hashed_password="",
            full_name="Guest User",
            avatar_url="/images.jpg",
            is_verified=True
        )
        db.add(guest_user)
        await db.commit()
        await db.refresh(guest_user)

        guest_profile = Profile(user_id=guest_user.id)
        db.add(guest_profile)
        await db.commit()

    return guest_user

# ==========================================
# 1. SIGNUP / REGISTER WITH EMAIL OTP
# ==========================================
@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
@router.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # 1. Normalize and validate inputs
    clean_email = normalize_email(user_in.email)
    clean_name = validate_full_name(user_in.full_name)
    
    if user_in.confirm_password and user_in.password != user_in.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    
    validate_password_strength(user_in.password)

    # 2. Check for existing user
    result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    existing_user = result.scalars().first()

    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(
                status_code=400,
                detail="This email is already registered. Please sign in."
            )
        else:
            # Re-send OTP for existing pending user
            new_otp = f"{secrets.randbelow(900000) + 100000}"
            existing_user.otp_code_hash = hash_otp(new_otp)
            existing_user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
            existing_user.otp_attempts = 0
            existing_user.otp_last_sent_at = datetime.utcnow()

            sent_ok, err_detail = email_service.send_otp_detailed(clean_email, new_otp, "verification")
            if not sent_ok:
                raise HTTPException(
                    status_code=400,
                    detail=f"Verification email delivery failed: {err_detail}"
                )
            
            await db.commit()
            return {
                "status": "pending_verification",
                "message": "Verification code sent to your email.",
                "email": clean_email
            }

    # 3. Generate secure 6-digit OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    otp_hash = hash_otp(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # 4. Dispatch Email FIRST before committing user to database
    sent_ok, err_detail = email_service.send_otp_detailed(clean_email, otp_code, "verification")
    if not sent_ok:
        raise HTTPException(
            status_code=400,
            detail=f"Verification email delivery failed: {err_detail}"
        )

    # 5. Create Pending User & Profile in DB
    try:
        hashed_pwd = get_password_hash(user_in.password)
        auto_username = f"user_{clean_email.split('@')[0]}_{secrets.token_hex(2)}"
        
        new_user = User(
            email=clean_email,
            username=auto_username,
            phone_number=user_in.phone_number,
            hashed_password=hashed_pwd,
            full_name=clean_name,
            avatar_url="/images.jpg",
            is_verified=False, # Pending OTP verification
            otp_code_hash=otp_hash,
            otp_expires_at=expires_at,
            otp_attempts=0,
            otp_last_sent_at=datetime.utcnow()
        )
        db.add(new_user)
        await db.flush()

        profile = Profile(user_id=new_user.id)
        db.add(profile)

        await db.commit()

        print(f"[SPIDY AUTH PENDING] Verification OTP sent to {clean_email}")

        return {
            "status": "pending_verification",
            "message": "Verification code sent to your email.",
            "email": clean_email
        }
    except Exception as e:
        await db.rollback()
        print(f"[SPIDY AUTH ROLLBACK] Signup failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Account creation failed: {str(e)}"
        )

# ==========================================
# 2. VERIFY EMAIL OTP
# ==========================================
@router.post("/auth/verify-email")
@router.post("/auth/verify-otp")
async def verify_email_otp(req: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    clean_email = normalize_email(req.email)
    code = req.otp_code.strip()

    if len(code) != 6 or not code.isdigit():
        raise HTTPException(status_code=400, detail="Verification code must be exactly 6 digits.")

    result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found. Please sign up.")

    if user.is_verified:
        # Already verified: issue access token
        access_token = create_access_token(user.id)
        return TokenOut(
            access_token=access_token,
            token_type="bearer",
            user=UserOut.model_validate(user)
        )

    # Check Max Attempts
    if user.otp_attempts >= 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum verification attempts exceeded. Please click 'Resend Code'."
        )

    # Check Expiry
    if user.otp_expires_at and user.otp_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new code."
        )

    # Verify Code Hash
    if not user.otp_code_hash or user.otp_code_hash != hash_otp(code):
        user.otp_attempts += 1
        await db.commit()
        remaining = 5 - user.otp_attempts
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
        )

    # Activate Account & Clear OTP
    user.is_verified = True
    user.otp_code_hash = None
    user.otp_attempts = 0
    user.otp_expires_at = None
    user.last_login_at = datetime.utcnow()

    # Generate JWT Session
    access_token = create_access_token(user.id)
    refresh_token, ref_expires = create_refresh_token(user.id)
    db.add(RefreshToken(user_id=user.id, token_hash=hash_otp(refresh_token), expires_at=ref_expires))

    await db.commit()
    await db.refresh(user)

    print(f"[SPIDY AUTH VERIFIED] Account activated: {clean_email}")

    return TokenOut(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

# ==========================================
# 3. RESEND OTP CODE (60-SECOND COOLDOWN)
# ==========================================
@router.post("/auth/resend-otp")
async def resend_otp(req: ResendOTPRequest, db: AsyncSession = Depends(get_db)):
    clean_email = normalize_email(req.email)

    result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if user.is_verified:
        return {"status": "success", "message": "Account is already verified. Please sign in."}

    # 60-Second Cooldown Enforcement
    if user.otp_last_sent_at:
        elapsed = (datetime.utcnow() - user.otp_last_sent_at).total_seconds()
        if elapsed < 60:
            remaining = int(60 - elapsed)
            raise HTTPException(
                status_code=400,
                detail=f"Please wait {remaining} seconds before requesting a new code."
            )

    new_otp = f"{secrets.randbelow(900000) + 100000}"
    
    # Dispatch Email FIRST
    sent_ok, err_detail = email_service.send_otp_detailed(clean_email, new_otp, "verification")
    if not sent_ok:
        raise HTTPException(
            status_code=400,
            detail=f"Verification email delivery failed: {err_detail}"
        )

    # Invalidate previous OTP & update record
    user.otp_code_hash = hash_otp(new_otp)
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    user.otp_attempts = 0
    user.otp_last_sent_at = datetime.utcnow()

    await db.commit()

    return {
        "status": "success",
        "message": "A new 6-digit verification code has been sent to your email."
    }

# ==========================================
# 4. LOCAL LOGIN
# ==========================================
@router.post("/auth/login", response_model=TokenOut)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    clean_email = normalize_email(user_in.email)

    result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    user = result.scalars().first()

    # Check Account Lockout
    if user and user.locked_until and user.locked_until > datetime.utcnow():
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(
            status_code=400,
            detail=f"Account locked due to repeated failed login attempts. Try again in {remaining + 1} minutes."
        )

    # Validate Credentials
    if not user or not user.hashed_password or not verify_password(user_in.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            await db.commit()
        db.add(LoginAttempt(email=clean_email, success=False))
        await db.commit()
        raise HTTPException(status_code=400, detail="Incorrect email or password.")

    if not user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Your account email is not yet verified. Please verify your email code."
        )

    # Reset lockout counters & record login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()
    db.add(LoginAttempt(email=clean_email, success=True))

    access_token = create_access_token(user.id)
    refresh_token, ref_expires = create_refresh_token(user.id)

    db.add(RefreshToken(user_id=user.id, token_hash=hash_otp(refresh_token), expires_at=ref_expires))
    await db.commit()

    print(f"[SPIDY AUTH SUCCESS] User logged in successfully: {clean_email}")

    return TokenOut(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

# ==========================================
# 5. CURRENT USER (/me)
# ==========================================
@router.get("/auth/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

# ==========================================
# 6. LOGOUT
# ==========================================
@router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user_optional)):
    return {"status": "success", "message": "Logged out successfully."}

# ==========================================
# 7. PROFILE GET & UPDATE
# ==========================================
@router.get("/profile", response_model=ProfileOut)
@router.get("/auth/profile", response_model=ProfileOut)
async def get_profile(current_user: User = Depends(get_current_user_optional), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return ProfileOut.model_validate(profile)

@router.put("/profile", response_model=ProfileOut)
@router.patch("/profile", response_model=ProfileOut)
@router.put("/auth/profile", response_model=ProfileOut)
@router.patch("/auth/profile", response_model=ProfileOut)
async def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if profile_in.full_name is not None:
        current_user.full_name = validate_full_name(profile_in.full_name)
    if profile_in.username is not None:
        current_user.username = validate_username(profile_in.username)
    if profile_in.phone_number is not None:
        current_user.phone_number = profile_in.phone_number

    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    if profile_in.bio is not None:
        profile.bio = profile_in.bio
    if profile_in.preferred_ai_model is not None:
        profile.preferred_ai_model = profile_in.preferred_ai_model
    if profile_in.theme is not None:
        profile.theme = profile_in.theme
    if profile_in.language is not None:
        profile.language = profile_in.language
    if profile_in.notification_settings is not None:
        profile.notification_settings = profile_in.notification_settings

    await db.commit()
    await db.refresh(profile)
    return ProfileOut.model_validate(profile)

@router.post("/profile/avatar")
@router.post("/auth/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    save_path = os.path.join(settings.UPLOAD_DIR, f"avatar_{current_user.id}_{file.filename}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    current_user.avatar_url = f"/api/v1/auth/avatar/{file.filename}"
    await db.commit()
    return {"avatar_url": current_user.avatar_url}
