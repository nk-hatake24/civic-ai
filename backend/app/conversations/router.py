from fastapi import APIRouter, Depends
from app.db.mongoDB import get_database
from app.dependencies import get_current_user, CurrentUser

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.get("")
async def list_my_chats(user: CurrentUser = Depends(get_current_user)):
    db = get_database()
    # Scoped strictly to user.id
    cursor = db.conversations.find({"user_id": user.id}).sort("updated_at", -1)
    results = await cursor.to_list(length=50)
    return [{"id": str(r["_id"]), "title": r["title"]} for r in results]