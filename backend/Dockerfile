# --- STAGE 1: Builder ---
FROM python:3.12-slim AS builder

WORKDIR /build

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies for libraries like bcrypt/python-jose
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies into a local folder to copy later
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# --- STAGE 2: Runner ---
FROM python:3.12-slim AS runner

# Set metadata
LABEL maintainer="CivicAI Team"
LABEL version="1.0.0"

WORKDIR /app

# 1. Install Doppler CLI using the official binary script
# We install curl and ca-certificates first so we can download the script securely
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -Ls --retry 5 https://cli.doppler.com/install.sh | sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Setup Security: Create a non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser

# 3. Copy installed packages from builder
# Ensure we copy to a location the appuser can access
COPY --from=builder /root/.local /home/appuser/.local

# 4. Copy application code and set ownership
COPY --chown=appuser:appgroup . .

# 5. Set Environment Variables
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# 6. Switch to non-root user
USER appuser

# 7. Expose FastAPI port
EXPOSE 8000

# 8. Entrypoint: Use Doppler to inject secrets
# NOTE: You must pass DOPPLER_TOKEN as an env var when running this container
ENTRYPOINT ["doppler", "run", "--"]

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]