import os
import smtplib
import logging
from typing import Tuple
from dotenv import load_dotenv
from app.core.config import settings

logger = logging.getLogger("SpidyEmailService")

class EmailService:
    def send_otp_detailed(self, to_email: str, otp_code: str, purpose: str = "verification") -> Tuple[bool, str]:
        """
        Transactional Email Service prioritizing Gmail SMTP.
        Recipient is dynamically set to to_email.
        Returns: (success: bool, detail_message: str)
        """
        # Ensure fresh environment variables from .env
        load_dotenv()

        subject = "Your Spidy AI Verification Code" if purpose == "verification" else "Spidy AI Password Reset Code"
        
        # Read Server-Side SMTP Settings (.env)
        smtp_host = (os.getenv("SMTP_HOST") or getattr(settings, "SMTP_HOST", "smtp.gmail.com")).strip()
        smtp_port = int(os.getenv("SMTP_PORT") or getattr(settings, "SMTP_PORT", 587))
        
        # Clean user and password (strip non-breaking spaces and spaces from Google App Password)
        raw_user = os.getenv("SMTP_USERNAME") or getattr(settings, "SMTP_USERNAME", "")
        raw_pass = os.getenv("SMTP_PASSWORD") or getattr(settings, "SMTP_PASSWORD", "")
        raw_from = os.getenv("SMTP_FROM") or os.getenv("SMTP_FROM_EMAIL") or raw_user or "spidyai.app@gmail.com"

        smtp_user = raw_user.replace('\xa0', '').strip()
        smtp_pass = raw_pass.replace('\xa0', '').replace(' ', '').strip()
        smtp_from = raw_from.replace('\xa0', '').strip()

        smtp_available = bool(smtp_host and smtp_user and smtp_pass)

        # Print Provider Info as requested
        provider_name = "Gmail SMTP" if smtp_available else "NONE"
        
        print("\n" + "="*50)
        print(f"[EMAIL] Provider selected: {provider_name}")
        print(f"[EMAIL] Recipient: {to_email}")
        print(f"[EMAIL] Sending...")
        print("="*50 + "\n")

        if not smtp_available:
            err_msg = "Gmail SMTP is not configured in server .env (missing SMTP_USERNAME or SMTP_PASSWORD)."
            print(f"[EMAIL] SMTP delivery: FAILED ({err_msg})")
            return False, err_msg

        # --- PRIMARY & EXCLUSIVE PROVIDER: GMAIL SMTP ---
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

            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
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
            # Immediately return exact SMTP error (No Resend fallback)
            return False, err_detail

    def send_otp(self, to_email: str, otp_code: str, purpose: str = "verification") -> bool:
        success, _ = self.send_otp_detailed(to_email, otp_code, purpose)
        return success

email_service = EmailService()
