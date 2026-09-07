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
        Transactional Email Service prioritizing HTTP-based Resend API (Port 443 HTTPS) over SMTP.
        Returns: (success: bool, detail_message: str)
        """
        # Ensure fresh environment variables from .env
        load_dotenv()

        subject = "Your Spidy AI Verification Code" if purpose == "verification" else "Spidy AI Password Reset Code"
        
        # 1. PRIMARY & HIGH-RELIABILITY PROVIDER: RESEND HTTP API (PORT 443 HTTPS)
        resend_key = (os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", "")).strip()
        
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
            except Exception as e:
                err_msg = f"Resend API Exception: {str(e)}"
                print(f"[EMAIL] Resend API delivery: FAILED ({err_msg})")
                logger.warning(f"[EMAIL] {err_msg}")

        # 2. SECONDARY / FALLBACK PROVIDER: GMAIL SMTP
        smtp_host = (os.getenv("SMTP_HOST") or getattr(settings, "SMTP_HOST", "smtp.gmail.com")).strip()
        smtp_port = int(os.getenv("SMTP_PORT") or getattr(settings, "SMTP_PORT", 587))
        
        raw_user = os.getenv("SMTP_USERNAME") or getattr(settings, "SMTP_USERNAME", "")
        raw_pass = os.getenv("SMTP_PASSWORD") or getattr(settings, "SMTP_PASSWORD", "")
        raw_from = os.getenv("SMTP_FROM") or os.getenv("SMTP_FROM_EMAIL") or raw_user or "spidyai.app@gmail.com"

        smtp_user = raw_user.replace('\xa0', '').strip()
        smtp_pass = raw_pass.replace('\xa0', '').replace(' ', '').strip()
        smtp_from = raw_from.replace('\xa0', '').strip()

        smtp_available = bool(smtp_host and smtp_user and smtp_pass)

        if not smtp_available and not resend_key:
            err_msg = "No valid email credentials configured in server environment (missing RESEND_API_KEY or SMTP_USERNAME)."
            print(f"[EMAIL] Email delivery: FAILED ({err_msg})")
            return False, err_msg

        if smtp_available:
            try:
                from email.mime.text import MIMEText
                from email.mime.multipart import MIMEMultipart

                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = smtp_from if "@" in smtp_from else smtp_user
                msg["To"] = to_email

                text_content = f"Your Spidy AI verification code is: {otp_code}. Valid for 5 minutes."
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
                msg.attach(MIMEText(text_content, "plain", "utf-8"))
                msg.attach(MIMEText(html_content, "html", "utf-8"))

                with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(msg["From"], [to_email], msg.as_string())
                
                print("[EMAIL] SMTP delivery: SUCCESS")
                logger.info(f"[EMAIL] SMTP delivery SUCCESS to {to_email}")
                return True, "Email delivered via Gmail SMTP"
            except Exception as e:
                err_detail = f"Gmail SMTP error: {str(e)}"
                print(f"[EMAIL] SMTP delivery: FAILED ({err_detail})")
                logger.error(f"[EMAIL] {err_detail}")
                return False, err_detail

        return False, "Transactional email delivery failed."

    def send_otp(self, to_email: str, otp_code: str, purpose: str = "verification") -> bool:
        success, _ = self.send_otp_detailed(to_email, otp_code, purpose)
        return success

email_service = EmailService()
