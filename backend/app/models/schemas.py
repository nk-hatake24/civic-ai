from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Any

class MessageDoc(BaseModel):
    role: str # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationDoc(BaseModel):
    user_id: str
    title: str = "New Conversation"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)