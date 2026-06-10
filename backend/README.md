This is the complete, professional **README.md** for **CivicAI**. It is designed as a "Developer's Manual" to explain not just *how* to run it, but *why* it was built this way.

---

# 🇨🇲 CivicAI Backend - AI-Native eGov Platform

CivicAI is a production-grade Python backend designed to provide citizens and officials with real-time, AI-driven insights into government data (using World Bank Open Data). 

It uses an **Agentic Architecture** where an AI (Claude/Gemini/Groq) can "decide" to call tools to fetch real data, processing these requests in background workers to ensure the main API remains lightning-fast.

---

## 🏗 System Architecture

1.  **FastAPI Gateway**: Handles authentication, rate limiting, and job submission.
2.  **JWT Authentication**: Stateless security using `python-jose`. Every request is scoped to a `user_id`.
3.  **ARQ Job Queue**: AI requests are offloaded to Redis to prevent API timeouts.
4.  **Async Workers**: Background processes that run the "AI Agentic Loop" and execute tools.
5.  **Multi-Provider AI Service**: Failover logic that tries **Groq**, then **Alibaba Qwen**, then **Google Gemini**.
6.  **FastMCP (Model Context Protocol)**: Standardized tools that allow the AI to fetch World Bank data.
7.  **SSE (Server-Sent Events)**: Real-time updates pushed from the worker to the frontend via Redis.
8.  **Dual Storage**: 
    *   **MongoDB**: Persistent storage for user profiles and chat history.
    *   **Redis**: High-speed caching for API results and transient SSE events.

---

## 📂 Project Structure & File Map

### `app/` (Core Application)
*   **`main.py`**: The entry point. Initializes FastAPI, connects to databases, and mounts the routers. It handles the "Lifespan" (connecting/disconnecting DBs).
*   **`config.py`**: Uses `pydantic-settings` to validate `.env` variables. It ensures the app won't start if a key is missing.
*   **`dependencies.py`**: Contains `get_current_user`. This is the **Security Guard**. It decodes the JWT and provides the `user_id` to any route that needs it.

### `app/auth/` (Identity & Security)
*   **`router.py`**: Defines `/auth/register` and `/auth/login` endpoints.
*   **`service.py`**: Logic for creating users in MongoDB and verifying passwords.
*   **`utils.py`**: Low-level helpers for hashing passwords (`bcrypt`) and signing JWT tokens.
*   **`schemas.py`**: Data models for login requests and token responses.

### `app/db/` (Data Layers)
*   **`mongo.py`**: Motor (Async MongoDB) configuration. Includes `create_indexes()` which physically prevents one user from seeing another user's data.
*   **`redis.py`**: Connection logic for Upstash/Local Redis. Includes SSL support for cloud providers.

### `app/services/` (External Intelligence)
*   **`ai_multi_provider.py`**: The "Brain Selector." It iterates through providers (Groq, Gemini, etc.) if one fails or is slow.
*   **`worldbank.py`**: Async client for the World Bank API. Includes a **24-hour Redis cache** to save money and increase speed.

### `app/worker/` (The Engine Room)
*   **`queue.py`**: Configuration for the ARQ worker. Connects the worker to the same Redis as the API.
*   **`tasks.py`**: The **Agentic Loop**. This is where the AI "thinks," calls World Bank tools, saves the results to MongoDB, and pushes updates to the SSE stream.

### `app/chat/` & `app/conversations/`
*   **`chat/router.py`**: 
    *   `POST /`: Enqueues a new AI job.
    *   `GET /stream/{job_id}`: The SSE endpoint that allows the frontend to watch the AI work in real-time.
*   **`conversations/router.py`**: Fetches chat history. Every query is strictly filtered by `user_id`.

---

## 🔑 Environment Variables (`.env`)

| Variable | Description |
| :--- | :--- |
| `JWT_SECRET` | A long random string used to sign security tokens. |
| `ANTHROPIC_API_KEY` | Key for Claude 3.5 Sonnet. |
| `GROQ_API_KEY` | Key for ultra-fast Llama 3/Mixtral models. |
| `ALIBABA_API_KEY` | Key for Qwen models (excellent for JSON). |
| `GOOGLE_API_KEY` | Key for Gemini 2.0 (supports "Thinking" mode). |
| `MONGODB_URL` | Connection string (Local or MongoDB Atlas). |
| `REDIS_URL` | Connection string (Starts with `rediss://` for Upstash). |

---

## 🚀 Installation & Setup

### 1. Prerequisites
*   Python 3.12+
*   A running Redis instance (Upstash is recommended).
*   A running MongoDB instance (Atlas is recommended).

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Launching the Platform (2 Terminals Required)

**Terminal 1: The API Gateway**
This handles the web traffic and the documentation.
```powershell
$env:PYTHONPATH = "."
python -m uvicorn app.main:app --reload
```
*Access Docs at: `http://127.0.0.1:8000/docs`*

**Terminal 2: The Async Worker**
This processes the AI logic and tools.
```powershell
$env:PYTHONPATH = "."
python -m arq app.worker.queue.WorkerSettings
```

---

## 🧪 Testing Strategy

CivicAI follows a "Layered Testing" approach. We use `pytest` with `pytest-asyncio` for all tests.

### 1. Infrastructure Tests (`test_infrastructure.py`)
Verifies that the backend can successfully Ping, Write, and Read from MongoDB and Redis.

### 2. World Bank Tests (`test_worldbank.py`)
Verifies that the `WorldBankClient` can reach the real external API and that the Redis caching logic is saving/retrieving data correctly.

### 3. API Route Tests (`test_api_routes.py`)
Simulates a real user journey:
1.  **Registering** a new account.
2.  **Logging in** to receive a JWT.
3.  **Chatting**: Submitting a job to the queue and verifying a `job_id` is returned.
4.  **Security**: Verifying that unauthorized requests are blocked with a `401`.

### 4. AI Failover Tests (`test_ai_providers.py`)
**[Currently Excluded]**: These tests are ignored by default to save API costs and time. They verify that if Google Gemini fails, the system automatically switches to Groq or Alibaba.
To run them specifically: `pytest tests/test_ai_providers.py`.

**To run all standard tests:**
```bash
$env:PYTHONPATH = "."
pytest --ignore=tests/test_ai_providers.py -v -s
```

---

## 📡 How to Use the API (The Chat Flow)

The CivicAI API uses an **Asynchronous Job Pattern**.

1.  **Authentication**:
    *   `POST /auth/login` with your credentials.
    *   Receive an `access_token`.
2.  **Job Submission**:
    *   `POST /api/chat` with your message and your `Authorization: Bearer <token>` header.
    *   The API will respond immediately with a `job_id` and a `conversation_id`.
3.  **Real-time Streaming**:
    *   Connect your frontend to `GET /api/chat/stream/{job_id}`.
    *   This is an **SSE (Server-Sent Events)** endpoint. You will receive real-time JSON updates:
        *   `{"type": "status", "data": "AI is thinking..."}`
        *   `{"type": "tool_start", "data": "Calling World Bank..."}`
        *   `{"type": "final_answer", "data": "The population of Cameroon is..."}`

---

## 🛡 Security Highlights
*   **72-Byte Safety**: Bcrypt passwords are automatically truncated to 72 bytes to prevent hashing algorithm overflows.
*   **Bcrypt Native**: Uses the native `bcrypt` library (not passlib) for full compatibility with Python 3.14.
*   **Multistage Build**: Production Docker images contain zero compilers or build tools, drastically reducing the attack surface.
*   **Non-Root Execution**: Both Frontend and Backend containers run as non-privileged users.

---

## 🛠 MCP Tools Available to AI
The AI has access to the following specialized tools via the worker:
1.  `get_economic_indicator`: Fetches GDP, Population, Inflation, or Unemployment.
2.  `get_country_info`: Fetches capital, region, and income level.

---
**CivicAI** - *Empowering citizens through data and intelligence.*