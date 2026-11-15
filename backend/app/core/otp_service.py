import logging
import random
import time
from typing import Dict, Tuple
from app.config import settings

logger = logging.getLogger("classsphere.otp")

# In-memory store for OTP simulation/dev verification: phone -> (code, expiry_timestamp, attempts)
_otp_store: Dict[str, Tuple[str, float, int]] = {}

MAX_ATTEMPTS = 5
OTP_EXPIRY_SECONDS = 300  # 5 minutes


class OTPService:
    @staticmethod
    async def send_verification_code(phone_number: str) -> bool:
        """
        Sends verification code via Twilio Verify if configured,
        or secure development verification if in SIMULATION mode.
        """
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_VERIFY_SERVICE_SID:
            try:
                # Real Twilio Verify integration
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                verification = client.verify.v2.services(
                    settings.TWILIO_VERIFY_SERVICE_SID
                ).verifications.create(to=phone_number, channel="sms")
                logger.info(f"Twilio Verify sent to {phone_number}: status={verification.status}")
                return True
            except Exception as e:
                logger.error(f"Twilio Verify failed for {phone_number}: {e}")
                # If production, fail
                if settings.APP_MODE == "CONNECTED":
                    return False

        # Development / Simulation mode verification
        # Generates a pseudo-random 6 digit code
        code = str(random.randint(100000, 999999))
        _otp_store[phone_number] = (code, time.time() + OTP_EXPIRY_SECONDS, 0)
        logger.warning(
            f"[DEV/SIMULATION MODE] Verification code for {phone_number} is {code}. "
            "Notice: Development OTP fallback must never be enabled in production."
        )
        return True

    @staticmethod
    async def verify_code(phone_number: str, code: str) -> bool:
        """
        Verifies phone OTP code against Twilio or dev store with attempt limiting.
        """
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_VERIFY_SERVICE_SID:
            try:
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                verification_check = client.verify.v2.services(
                    settings.TWILIO_VERIFY_SERVICE_SID
                ).verification_checks.create(to=phone_number, code=code)
                logger.info(f"Twilio Verify check status: {verification_check.status}")
                return verification_check.status == "approved"
            except Exception as e:
                logger.error(f"Twilio Verify check failed for {phone_number}: {e}")
                if settings.APP_MODE == "CONNECTED":
                    return False

        # Dev / Simulation mode check
        record = _otp_store.get(phone_number)
        if not record:
            return False

        stored_code, expiry, attempts = record
        if time.time() > expiry:
            del _otp_store[phone_number]
            logger.info(f"OTP expired for {phone_number}")
            return False

        if attempts >= MAX_ATTEMPTS:
            del _otp_store[phone_number]
            logger.warning(f"Maximum OTP attempts exceeded for {phone_number}")
            return False

        # Increment attempts
        _otp_store[phone_number] = (stored_code, expiry, attempts + 1)

        # Allow demo master code "123456" for automated testing in SIMULATION mode
        if code == stored_code or (settings.APP_MODE == "SIMULATION" and code == "123456"):
            del _otp_store[phone_number]
            return True

        return False
