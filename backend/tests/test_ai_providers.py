# backend/tests/test_ai_providers.py
import pytest
from unittest.mock import AsyncMock, patch
from app.services.ai_multi_provider import ai_service

# Standard test message
TEST_MESSAGES = [
    {"role": "system", "content": "You are a helpful assistant. Reply with one word: 'OK'."},
    {"role": "user", "content": "Hello"}
]

@pytest.mark.asyncio
async def test_google_gemini_call():
    """Verify Gemini (Google) is responding correctly."""
    try:
        response = await ai_service.call_gemini("gemini-2.0-flash", TEST_MESSAGES)
        assert response is not None
        assert len(response) > 0
        print(f"\n✅ Gemini Response: {response[:20]}...")
    except Exception as e:
        pytest.fail(f"Gemini call failed: {e}")

@pytest.mark.asyncio
async def test_groq_call():
    """Verify Groq is responding correctly."""
    try:
        # We use a smaller model for faster testing
        response = await ai_service.call_groq("llama-3.1-8b-instant", TEST_MESSAGES)
        assert response is not None
        assert len(response) > 0
        print(f"\n✅ Groq Response: {response[:20]}...")
    except Exception as e:
        pytest.fail(f"Groq call failed: {e}")

@pytest.mark.asyncio
async def test_alibaba_qwen_call():
    """Verify Alibaba Qwen is responding correctly."""
    try:
        response = await ai_service.call_alibaba("qwen-plus", TEST_MESSAGES)
        assert response is not None
        assert len(response) > 0
        print(f"\n✅ Alibaba Response: {response[:20]}...")
    except Exception as e:
        pytest.fail(f"Alibaba call failed: {e}")

@pytest.mark.asyncio
async def test_ai_multi_provider_failover():
    """
    CRITICAL TEST: Simulate a failure in Google to 
    verify it automatically switches to Groq.
    """
    # 1. We mock 'call_gemini' to raise an error
    with patch.object(ai_service, 'call_gemini', side_effect=Exception("Google API Down")):
        # 2. We mock 'call_groq' to return a success
        with patch.object(ai_service, 'call_groq', AsyncMock(return_value="Recovered via Groq")):
            
            content, provider = await ai_service.generate_response(TEST_MESSAGES)
            
            # 3. Assertions
            assert "groq" in provider
            assert content == "Recovered via Groq"
            print(f"\n✅ Failover Logic Verified: Switched to {provider}")

@pytest.mark.asyncio
async def test_ai_multi_provider_total_failure():
    """Verify that if ALL providers fail, we get a clear exception."""
    with patch.object(ai_service, 'call_gemini', side_effect=Exception("Error")):
        with patch.object(ai_service, 'call_groq', side_effect=Exception("Error")):
            with patch.object(ai_service, 'call_alibaba', side_effect=Exception("Error")):
                
                with pytest.raises(Exception) as excinfo:
                    await ai_service.generate_response(TEST_MESSAGES)
                
                assert "All AI Providers failed" in str(excinfo.value)
                print(f"\n✅ Total Failure Handling Verified")