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

# 1. Install Doppler CLI
RUN apt-get update && apt-get install -y --no-install-recommends apt-transport-https ca-certificates curl gnupg && \
    curl -sLf --retry 3 --retry-delay 2 https://packages.doppler.com/public/cli/gpg.744D481B46951664.key | apt-key add - && \
    echo "deb https://packages.doppler.com/public/cli/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
    apt-get update && \
    apt-get install -y doppler && \
    rm -rf /var/lib/apt/lists/*

# 2. Setup Security: Create a non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser
USER appuser

# 3. Copy installed packages from builder
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# 4. Copy application code
COPY --chown=appuser:appgroup . .

# 5. Expose FastAPI port
EXPOSE 8000

# 6. Entrypoint: Use Doppler to inject secrets into the process memory
# DOPPLER_TOKEN must be provided at runtime via environment variable
ENTRYPOINT ["doppler", "run", "--"]

# Default command (can be overridden by docker-compose for the worker)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]