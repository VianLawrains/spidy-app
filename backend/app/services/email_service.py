import os
import smtplib
import logging
import httpx
from typing import Tuple
from dotenv import load_dotenv
from app.core.config import settings

logger = logging.getLogger("SpidyEmailService")

RESEND_API_URL = "https://api.resend.com/emails"

class EmailService:
    def send_otp_detailed(self, to_email: str, otp_code: str, purpose: str = "verification") -> Tuple[bool, str]:
        """
        Transactional Email Service prioritizing HTTP-based Resend API (Port 443 HTTPS).
        Returns: (success: bool, detail_message: str)
        """
        # Load environment variables cleanly without overriding existing system env vars
        load_dotenv(override=False)

        subject = "Your Spidy AI Verification Code" if purpose == "verification" else "Spidy AI Password Reset Code"
        
        # 1. PRIMARY & HIGH-RELIABILITY PROVIDER: RESEND HTTP API (PORT 443 HTTPS)
        resend_key = (os.environ.get("RESEND_API_KEY") or os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", "")).strip()
        
        if resend_key:
            print("\n" + "="*50)
            print(f"[EMAIL] Provider selected: Resend HTTP API (Port 443 HTTPS)")
            print(f"[EMAIL] Recipient: {to_email}")
            print(f"[EMAIL] Sending...")
            print("="*50 + "\n")
            
            headers = {
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json"
            }
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 480px; margin: 0 auto; border: 1px solid #1f2937;">
                <h2 style="color: #e63946; margin-top: 0;">Spidy AI Intelligence Suite</h2>
                <p style="font-size: 14px; color: #d1d5db;">Your verification code is below. Enter this 6-digit code to complete your {purpose}.</p>
                <div style="background-color: #1a1d29; border: 1px solid #e63946; padding: 16px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff; text-align: center; border-radius: 8px; margin: 20px 0; font-family: monospace;">
                    {otp_code}
                </div>
                <p style="font-size: 12px; color: #9ca3af;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
            </div>
            """
            
            payload = {
                "from": "Spidy AI <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            try:
                with httpx.Client(timeout=15.0) as client:
                    res = client.post(RESEND_API_URL, json=payload, headers=headers)
                    if res.status_code in [200, 201]:
                        print("[EMAIL] Resend API delivery: SUCCESS")
                        logger.info(f"[EMAIL] Resend API delivery SUCCESS to {to_email}")
                        return True, "Email delivered via Resend HTTP API"
                    else:
                        err_msg = f"Resend API error status {res.status_code}: {res.text[:200]}"
                        print(f"[EMAIL] Resend API delivery: FAILED ({err_msg})")
                        logger.warning(f"[EMAIL] {err_msg}")
                        return False, err_msg
            except Exception as e:
                err_msg = f"Resend API Exception: {str(e)}"
                print(f"[EMAIL] Resend API delivery: FAILED ({err_msg})")
                logger.warning(f"[EMAIL] {err_msg}")
                return False, err_msg

        # If RESEND_API_KEY is missing, report exact configuration error cleanly
        err_msg = "RESEND_API_KEY is missing or empty in server environment (.env). Please add RESEND_API_KEY in Render Dashboard Environment variables."
        print(f"[EMAIL] Email delivery: FAILED ({err_msg})")
        logger.error(f"[EMAIL] {err_msg}")
        return False, err_msg

    def send_otp(self, to_email: str, otp_code: str, purpose: str = "verification") -> bool:
        success, _ = self.send_otp_detailed(to_email, otp_code, purpose)
        return success

email_service = EmailService()
