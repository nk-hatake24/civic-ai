# backend/tests/test_api_routes.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

# We use the ASGITransport to talk to our FastAPI app without needing it to be running in another terminal
@pytest.fixture
async def ac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

async def test_full_auth_and_chat_flow(ac):
    """Test Register -> Login -> Chat Submission."""
    
    # 1. Register
    user_data = {
        "email": "teste111@civicai.cm",
        "password": "securepassword123",
        "full_name": "Test User"
    }
    reg_resp = await ac.post("/auth/register", json=user_data)
    # If 400, it might already exist from a previous test, that's fine
    assert reg_resp.status_code in [200, 400] 

    # 2. Login
    login_resp = await ac.post("/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Chat Submission (The Scoping Test)
    chat_req = {"message": "Hello CivicAI, what is the GDP of Cameroon?"}
    chat_resp = await ac.post("/api/chat", json=chat_req, headers=headers)
    
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert "job_id" in data
    assert "conversation_id" in data
    print(f"\n✅ Chat Endpoint OK: Job {data['job_id']} created.")

async def test_unauthorized_access(ac):
    """Verify that protected routes return 401 without a token."""
    resp = await ac.get("/api/conversations")
    assert resp.status_code == 401
    print("\n✅ Security Wall Verified: Unauthorized access blocked.")