import hmac
import hashlib
import base64
import json
import time
from app.core.config import settings

def generate_token(data: dict) -> str:
    """
    Generates a secure, signed JWT-like token containing custom payload data.
    Uses HMAC-SHA256 signature to guarantee token integrity.
    """
    payload = {
        "data": data,
        "exp": time.time() + (86400 * 7)  # Token valid for 7 days
    }
    payload_str = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(settings.SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    return f"{payload_str}.{signature}"

def verify_token(token: str) -> dict | None:
    """
    Verifies a token's signature and expiration, returning the decoded payload data.
    Returns None if the token is invalid, tampered with, or expired.
    """
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_str, signature = parts
        expected_signature = hmac.new(settings.SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            return None
        
        payload = json.loads(base64.urlsafe_b64decode(payload_str.encode()).decode())
        if time.time() > payload["exp"]:
            return None  # Token expired
        return payload["data"]
    except Exception:
        return None

def hash_password(password: str) -> str:
    """
    Hash a password using PBKDF2 HMAC-SHA256 with a unique salt.
    """
    import os
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}:{key.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against its stored PBKDF2 hash.
    """
    try:
        if not hashed_password or ":" not in hashed_password:
            return False
        salt_hex, key_hex = hashed_password.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(key, new_key)
    except Exception:
        return False

