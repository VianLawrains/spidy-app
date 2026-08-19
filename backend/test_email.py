import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.email_service import email_service
from app.core.config import settings

def run_test():
    if len(sys.argv) < 2:
        print("Usage: python test_email.py recipient@example.com")
        sys.exit(1)

    recipient = sys.argv[1].strip()
    print(f"\n==================================================")
    print(f"[SPIDY AI TRANSACTIONAL EMAIL TEST]")
    print(f"-> Target Recipient: {recipient}")
    
    resend_key = os.getenv("RESEND_API_KEY") or settings.RESEND_API_KEY
    smtp_host = os.getenv("SMTP_HOST") or settings.SMTP_HOST
    smtp_user = os.getenv("SMTP_USERNAME") or settings.SMTP_USERNAME

    if resend_key:
        print("-> Provider Selected: Resend REST API")
    elif smtp_host and smtp_user:
        print(f"-> Provider Selected: SMTP ({smtp_host})")
    else:
        print("-> Provider Selected: NONE (Unconfigured)")
        print("[NOTICE] No email provider (Resend or SMTP) is currently configured in .env")
        print("==================================================\n")

    print("-> Triggering test 6-digit OTP code dispatch...")
    test_otp = "998877"
    success = email_service.send_otp(recipient, test_otp, purpose="verification")

    if success:
        print("[STATUS] SUCCESS - Email provider accepted the message for delivery!")
    else:
        print("[STATUS] FAILED - Email provider rejected or unconfigured.")
    print("==================================================\n")

if __name__ == "__main__":
    run_test()
