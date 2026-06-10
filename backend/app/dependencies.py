from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings
from pydantic import BaseModel

class CurrentUser(BaseModel):
    id: str
    email: str
    role: str

security = HTTPBearer()

async def get_current_user(cred: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    settings = get_settings()
    try:
        payload = jwt.decode(cred.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return CurrentUser(id=user_id, email=payload.get("email"), role=payload.get("role"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")