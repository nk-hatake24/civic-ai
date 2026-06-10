# --- STAGE 1: Builder ---
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python dependencies locally
RUN pip install --user --no-cache-dir -r requirements.txt


# --- STAGE 2: Runner ---
FROM python:3.12-slim AS runner

WORKDIR /app

# System dependencies + Doppler
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl ca-certificates gnupg && \
    curl -Ls https://cli.doppler.com/install.sh | sh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/appuser/.local

# Fix permissions
RUN chown -R appuser:appgroup /home/appuser/.local

# Copy application code
COPY --chown=appuser:appgroup . .

# Environment variables
ENV PATH="/home/appuser/.local/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

USER appuser

# Doppler as entrypoint (inject secrets at runtime)
ENTRYPOINT ["doppler", "run", "--"]

# App command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]