# --- STAGE 1: Builder ---
FROM python:3.12-slim AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl
COPY requirements.txt .
# Install to /root/.local
RUN pip install --user --no-cache-dir -r requirements.txt

# --- STAGE 2: Runner ---
FROM python:3.12-slim AS runner
WORKDIR /app

# 1. INSTALL DOPPLER (The Official Script Method)
# We must install gnupg first so the script can verify the signature.
# We use DEBIAN_FRONTEND=noninteractive to avoid the 'Teletype' error.
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
    curl -Ls https://cli.doppler.com/install.sh | sh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 2. USER SETUP
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser

# 3. COPY PACKAGES FROM BUILDER
# Note: Ensure the path matches where pip installed them in Stage 1
COPY --from=builder /root/.local /home/appuser/.local

# 4. COPY CODE
COPY --chown=appuser:appgroup . .

# 5. ENVIRONMENT
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

USER appuser

# 6. DOPPLER INTEGRATION (From Docs)
# The docs state: "Use the Doppler RUN command as the ENTRYPOINT"
# This ensures Doppler is the parent process and injects secrets into your app.
ENTRYPOINT ["doppler", "run", "--"]

# 7. YOUR APP COMMAND
# Since Doppler is the Entrypoint, this CMD is passed as an argument to 'doppler run --'
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]