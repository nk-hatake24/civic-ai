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

WORKDIR /app

# 1. Install Doppler CLI
# We add 'gnupg' because the Doppler install script needs 'gpg' to verify the binary signature
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg && \
    curl -Ls --retry 5 https://cli.doppler.com/install.sh | sh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 2. Setup Security: Create a non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser

# 3. Copy installed packages from builder
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
ENTRYPOINT ["doppler", "run", "--"]

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]