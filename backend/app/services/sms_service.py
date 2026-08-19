import os
import logging

logger = logging.getLogger("SpidySMSService")

class SMSService:
    def send_otp(self, phone_number: str, otp_code: str) -> bool:
        """Send SMS OTP via Twilio if configured, or print to console if unconfigured"""
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_from = os.getenv("TWILIO_PHONE_NUMBER")

        twilio_configured = bool(twilio_sid and twilio_token and twilio_from)

        print("\n" + "="*50)
        print("[SPIDY SMS OTP DISPATCH]")
        print(f"-> Phone: {phone_number}")
        print(f"-> Code: [{otp_code}]")
        if not twilio_configured:
            print("[DEVELOPMENT NOTICE] Twilio SMS not configured. Using fallback console OTP.")
        print("="*50 + "\n")

        if twilio_configured:
            try:
                from twilio.rest import Client
                client = Client(twilio_sid, twilio_token)
                message = client.messages.create(
                    body=f"Your Spidy AI verification code is: {otp_code}. Valid for 5 minutes.",
                    from_=twilio_from,
                    to=phone_number
                )
                logger.info(f"Twilio SMS sent to {phone_number}, SID: {message.sid}")
                return True
            except Exception as e:
                logger.error(f"Failed to send Twilio SMS: {e}")
                return False
        return True

sms_service = SMSService()
