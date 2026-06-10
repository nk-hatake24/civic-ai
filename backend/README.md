# 🇨🇲 CivicAI - AI-Native eGov Platform

CivicAI is a production-grade AI-native platform designed to provide citizens and officials with real-time insights into government data using World Bank Open Data. 

The system is built with an **Agentic Architecture**: the AI (Gemini, Groq, or Qwen) can decide to use specialized tools to fetch real economic data, processing these requests in background workers to keep the user interface responsive and fluid.

---

## 🏗 System Architecture

1.  **FastAPI Gateway**: Handles authentication, rate limiting, and job orchestration.
2.  **JWT Authentication**: Stateless security using `bcrypt`. Every request is scoped to a `user_id` to ensure data isolation.
3.  **ARQ Job Queue**: AI processing is offloaded to Redis to prevent API timeouts during long "reasoning" phases.
4.  **Async Workers**: Background processes that execute the "AI Agentic Loop" and fetch real-world data.
5.  **Multi-Provider AI Service**: A failover-resilient service that tries **Google Gemini (Thinking Mode)**, then **Groq (Llama 3)**, then **Alibaba Qwen** if a provider is down.
6.  **FastMCP (Model Context Protocol)**: A standardized tool layer that connects the AI "brain" to the World Bank "data".
7.  **SSE (Server-Sent Events)**: Real-time tokens and tool-status updates are pushed from the worker to the frontend via Redis.
8.  **Dual Storage**: 
    *   **MongoDB**: Persistent storage for user profiles and chat history.
    *   **Redis**: High-speed caching for API results and transient SSE events.

---

## 📂 Project Structure

```text
.
├── docker-compose.yml         # Root orchestration for Front, Back, DB, and Worker
├── frontend/                  # Next.js Application (PNPM + Standalone Build)
└── backend/                   # FastAPI Application
    ├── app/
    │   ├── auth/              # JWT, Password hashing, and Registration
    │   ├── chat/              # Chat job submission and SSE Streaming
    │   ├── conversations/     # History management (User-scoped)
    │   ├── db/                # MongoDB & Redis lifecycle
    │   ├── mcp/               # FastMCP Tool definitions
    │   ├── services/          # Multi-AI Provider and World Bank Client
    │   └── worker/            # ARQ Task definitions & background logic
    └── tests/                 # Full Testing Suite
```

---

## 🔑 Secrets Management (Doppler)

CivicAI uses **Doppler** for centralized secrets management. This ensures that `.env` files are never leaked in Docker images.

**Required Secrets:**
*   `JWT_SECRET`: For signing tokens.
*   `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `ALIBABA_API_KEY`, `GOOGLE_API_KEY`: For AI failover.
*   `MONGODB_URL` & `REDIS_URL`: For infrastructure connectivity.

---

## 🚀 How to Launch CivicAI

### Option A: With Docker (Recommended)
This launches the API, the Worker, the Frontend, MongoDB, and Redis in one command.

1.  Ensure you have `BACKEND_DOPPLER_TOKEN` and `FRONTEND_DOPPLER_TOKEN` in a `.env` file at the root.
2.  Run:
    ```bash
    docker-compose up --build
    ```

### Option B: Local Manual Start (For Development)
**Terminal 1: Redis & MongoDB**
Ensure your local or cloud instances are running.

**Terminal 2: The API**
```bash
cd backend
$env:PYTHONPATH = "."
python -m uvicorn app.main:app --reload
```

**Terminal 3: The Worker**
```bash
cd backend
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
**CivicAI** - *Empowering Cameroon through Data and Intelligence.*