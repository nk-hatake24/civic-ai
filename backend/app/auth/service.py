from fastapi import HTTPException, status
from app.db.mongoDB import get_database
from app.auth.utils import hash_password, verify_password, create_access_token
from app.auth.schemas import RegisterRequest, LoginRequest

async def register_user(req: RegisterRequest):
    db = get_database()
    # Check if user exists
    if await db.users.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "full_name": req.full_name,
        "role": "user"
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    token = create_access_token(user_id, req.email, "user")
    return {"access_token": token, "user_id": user_id}

async def login_user(req: LoginRequest):
    db = get_database()
    user = await db.users.find_one({"email": req.email})
    
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(str(user["_id"]), user["email"], user["role"])
    return {"access_token": token, "user_id": str(user["_id"])}