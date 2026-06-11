# app/services/ai_multi_provider.py
import json
import uuid
import openai
from groq import AsyncGroq
from google import genai
from google.genai import types
import anthropic
from app.config import get_settings


class MultiAIProvider:
    def __init__(self):
        self.settings = get_settings()
        self.google_client = genai.Client(api_key=self.settings.google_api_key)
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=self.settings.anthropic_api_key)
        self.groq_client = AsyncGroq(api_key=self.settings.groq_api_key)
        self.alibaba_client = openai.AsyncOpenAI(
            api_key=self.settings.alibaba_api_key,
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        )

    # ─────────────────────────────────────────────
    # GEMINI
    # ─────────────────────────────────────────────
    async def call_gemini(self, model: str, messages: list, tools: list = None):
        gemini_contents = []
        system_instruction = None

        for m in messages:
            role = m["role"]
            if role == "system":
                system_instruction = m["content"]
            elif role == "tool":
                gemini_contents.append(types.Content(
                    role="user",
                    parts=[types.Part.from_text(
                        text=f"Tool result for {m.get('name')}: {m['content']}"
                    )]
                ))
            elif role == "assistant":
                gemini_contents.append(types.Content(
                    role="model",
                    parts=[types.Part.from_text(text=m.get("content") or "")]
                ))
            else:
                gemini_contents.append(types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=m.get("content") or "")]
                ))

        # Convertir les tool schemas au format Gemini
        gemini_tools = []
        is_thinking_model = "thinking" in model.lower()

        if tools and not is_thinking_model:
            function_declarations = []
            for t in tools:
                f_data = t["function"]
                params = f_data.get("parameters", {})
                raw_properties = params.get("properties", {})

                type_map = {
                    "STRING": "STRING", "STR": "STRING",
                    "INTEGER": "INTEGER", "INT": "INTEGER",
                    "NUMBER": "NUMBER", "FLOAT": "NUMBER",
                    "BOOLEAN": "BOOLEAN", "BOOL": "BOOLEAN",
                    "ARRAY": "ARRAY", "OBJECT": "OBJECT",
                }

                properties = {}
                for k, v in raw_properties.items():
                    if not isinstance(v, dict):
                        continue

                    raw_type = v.get("type")
                    if isinstance(raw_type, str):
                        gemini_type = raw_type.upper()
                    elif "anyOf" in v or "oneOf" in v:
                        variants = v.get("anyOf", v.get("oneOf", []))
                        non_null = [x.get("type") for x in variants if x.get("type") != "null"]
                        gemini_type = (non_null[0] or "string").upper()
                    else:
                        gemini_type = "STRING"

                    gemini_type = type_map.get(gemini_type, "STRING")
                    properties[k] = types.Schema(
                        type=gemini_type,
                        description=v.get("description", "")
                    )

                function_declarations.append(types.FunctionDeclaration(
                    name=f_data["name"],
                    description=f_data.get("description", ""),
                    parameters=types.Schema(
                        type="OBJECT",
                        properties=properties,
                        required=params.get("required", [])
                    ) if properties else None
                ))

            if function_declarations:
                gemini_tools.append(types.Tool(function_declarations=function_declarations))

        generate_content_config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(include_thoughts=True) if is_thinking_model else None,
            temperature=0.7,
            system_instruction=system_instruction,
            tools=gemini_tools if gemini_tools else None
        )

        response = self.google_client.models.generate_content(
            model=model,
            contents=gemini_contents,
            config=generate_content_config,
        )

        # Parser les tool calls depuis les parts (plus fiable que response.function_calls)
        normalized_tool_calls = []
        try:
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "function_call") and part.function_call:
                        fc = part.function_call
                        normalized_tool_calls.append({
                            "id": f"call_{uuid.uuid4().hex[:8]}",
                            "type": "function",
                            "function": {
                                "name": fc.name,
                                "arguments": json.dumps(dict(fc.args))
                            }
                        })
        except Exception as e:
            print(f"⚠️ Gemini tool_calls parsing error: {e}")

        content = None
        try:
            content = response.text
        except Exception:
            pass

        class DynamicResponse:
            def __init__(self, content, tool_calls):
                self.content = content
                self.tool_calls = tool_calls

        return DynamicResponse(content=content, tool_calls=normalized_tool_calls)

    # ─────────────────────────────────────────────
    # GROQ
    # ─────────────────────────────────────────────
    async def call_groq(self, model: str, messages: list, tools: list = None):
        cleaned_messages = []
        for m in messages:
            clean_msg = {"role": m["role"], "content": m.get("content") or ""}
            if m["role"] == "tool":
                clean_msg["tool_call_id"] = m.get("tool_call_id")
                clean_msg["name"] = m.get("name")
            elif m["role"] == "assistant" and m.get("tool_calls"):
                clean_msg["tool_calls"] = m["tool_calls"]
            cleaned_messages.append(clean_msg)

        kwargs = {
            "model": model,
            "messages": cleaned_messages,
            "temperature": 0.5
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self.groq_client.chat.completions.create(**kwargs)
        message_obj = response.choices[0].message

        normalized_tool_calls = []
        if message_obj.tool_calls:
            for tc in message_obj.tool_calls:
                normalized_tool_calls.append({
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                })

        class DynamicResponse:
            def __init__(self, content, tool_calls):
                self.content = content
                self.tool_calls = tool_calls

        return DynamicResponse(content=message_obj.content, tool_calls=normalized_tool_calls)

    # ─────────────────────────────────────────────
    # ALIBABA
    # ─────────────────────────────────────────────
    async def call_alibaba(self, model: str, messages: list, tools: list = None):
        cleaned_messages = []
        for m in messages:
            clean_msg = {"role": m["role"], "content": m.get("content") or ""}
            if m["role"] == "tool":
                clean_msg["tool_call_id"] = m.get("tool_call_id")
                clean_msg["name"] = m.get("name")
            elif m["role"] == "assistant" and m.get("tool_calls"):
                clean_msg["tool_calls"] = m["tool_calls"]
            cleaned_messages.append(clean_msg)

        kwargs = {
            "model": model,
            "messages": cleaned_messages,
            "temperature": 0.5
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self.alibaba_client.chat.completions.create(**kwargs)
        message_obj = response.choices[0].message

        normalized_tool_calls = []
        if message_obj.tool_calls:
            for tc in message_obj.tool_calls:
                normalized_tool_calls.append({
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                })

        class DynamicResponse:
            def __init__(self, content, tool_calls):
                self.content = content
                self.tool_calls = tool_calls

        return DynamicResponse(content=message_obj.content, tool_calls=normalized_tool_calls)

    # ─────────────────────────────────────────────
    # ROUTER — fallback automatique entre providers
    # ─────────────────────────────────────────────
    async def generate_response(self, messages: list, tools: list = None):
        providers = [
            {
                "name": "groq",
                "models": ["llama-3.3-70b-versatile"],
                "func": self.call_groq
            },
            {
                "name": "google",
                # thinking en premier pour la qualité, flash en fallback
                "models": ["gemini-2.0-flash-thinking-preview-01-21", "gemini-2.0-flash"],
                "func": self.call_gemini
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
                    response_obj = await provider["func"](model, messages, tools=tools)
                    if response_obj:
                        return response_obj, f"{provider['name']}:{model}"
                except Exception as e:
                    print(f"--- CivicAI: {provider['name']} ({model}) failed: {e} ---")
                    continue

        raise Exception("Critical: All AI Providers failed.")


ai_service = MultiAIProvider()