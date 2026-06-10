# --- STAGE 1: Base ---
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Install Doppler CLI
# Alpine requires libc6-compat to run many binaries, and we need curl to fetch the script
RUN apk add --no-cache curl libc6-compat && \
    curl -Ls https://cli.doppler.com/install.sh | sh

# --- STAGE 2: Dependencies ---
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile

# --- STAGE 3: Builder ---
FROM deps AS builder
WORKDIR /app
COPY . .

# IMPORTANT: NEXT_PUBLIC_ variables are baked into the JS at build time.
# We pass the DOPPLER_TOKEN as a build argument here.
ARG DOPPLER_TOKEN
RUN if [ -z "$DOPPLER_TOKEN" ]; then \
      echo "Error: DOPPLER_TOKEN build arg is required"; exit 1; \
    fi && \
    doppler run -- pnpm build

# --- STAGE 4: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

# Install Doppler in the runner stage too (for runtime secrets like API keys)
RUN apk add --no-cache curl libc6-compat && \
    curl -Ls https://cli.doppler.com/install.sh | sh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Copy standalone build files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Doppler Entrypoint (Official Pattern)
# This allows Doppler to inject runtime secrets into the node process
ENTRYPOINT ["doppler", "run", "--"]
CMD ["node", "server.js"]