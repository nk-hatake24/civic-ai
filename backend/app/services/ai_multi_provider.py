import openai
from groq import Groq
from google import genai
from google.genai import types
import anthropic
import asyncio
from app.config import get_settings

class MultiAIProvider:
    def __init__(self):
        self.settings = get_settings()
        
        # 1. Google GenAI (New SDK - No .configure() needed here)
        self.google_client = genai.Client(api_key=self.settings.google_api_key)
        
        # 2. Anthropic
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=self.settings.anthropic_api_key)
        
        # 3. Groq
        self.groq_client = Groq(api_key=self.settings.groq_api_key)
        
        # 4. Alibaba (OpenAI Compatible)
        self.alibaba_client = openai.AsyncOpenAI(
            api_key=self.settings.alibaba_api_key,
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        )

    async def call_gemini(self, model: str, messages: list):
        # Extract user message
        user_text = messages[-1]["content"]
        
        generate_content_config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(include_thoughts=True) if "thinking" in model.lower() else None,
            temperature=0.7
        )

        # The new SDK is sync by default, but safe to run in our async worker
        response = self.google_client.models.generate_content(
            model=model,
            contents=user_text,
            config=generate_content_config,
        )
        return response.text

    async def call_groq(self, model: str, messages: list):
        response = self.groq_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.5
        )
        return response.choices[0].message.content

    async def call_alibaba(self, model: str, messages: list):
        response = await self.alibaba_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.5
        )
        return response.choices[0].message.content

    async def generate_response(self, messages: list):
        """ The Failover Loop Logic """
        providers = [
            {
                "name": "google", 
                "models": ["gemini-2.0-flash-thinking-preview-01-21", "gemini-2.0-flash"], 
                "func": self.call_gemini
            },
            {
                "name": "groq", 
                "models": ["llama-3.3-70b-versatile"], 
                "func": self.call_groq
            },
            {
                "name": "alibaba", 
                "models": ["qwen-plus"], 
                "func": self.call_alibaba
            },
        ]

        for provider in providers:
            for model in provider["models"]:
                try:
                    print(f"--- CivicAI: Trying {provider['name']} ({model}) ---")
                    content = await provider["func"](model, messages)
                    if content:
                        return content, f"{provider['name']}:{model}"
                except Exception as e:
                    print(f"--- CivicAI: {provider['name']} failed: {str(e)} ---")
                    continue
        
        raise Exception("Critical: All AI Providers failed.")

# Initialize the single instance
ai_service = MultiAIProvider()