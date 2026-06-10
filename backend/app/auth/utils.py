import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.config import get_settings

settings = get_settings()

def hash_password(password: str) -> str:
    """
    Hashes a password using native bcrypt.
    Truncates to 72 bytes safely to avoid bcrypt's limit.
    """
    # 1. Convert to bytes (UTF-8)
    pwd_bytes = password.encode('utf-8')
    # 2. Truncate to 72 bytes (industry standard for bcrypt)
    pwd_bytes = pwd_bytes[:72]
    # 3. Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    # 4. Return as a string for storage in MongoDB
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against the stored hash.
    """
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expire
    }
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)