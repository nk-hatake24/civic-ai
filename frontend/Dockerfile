# --- STAGE 1: Base ---
FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && \
    apk add --no-cache libc6-compat wget && \
    wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' \
        -O /etc/apk/keys/doppler@doppler-alpine.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' \
        | tee -a /etc/apk/repositories && \
    apk add doppler

WORKDIR /app


# --- STAGE 2: Dependencies ---
FROM base AS deps

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile


# --- STAGE 3: Builder ---
FROM deps AS builder

COPY . .

# IMPORTANT: build should NOT depend on Doppler secrets
RUN pnpm build


# --- STAGE 4: Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache libc6-compat wget && \
    wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' \
        -O /etc/apk/keys/doppler@doppler-alpine.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' \
        | tee -a /etc/apk/repositories && \
    apk add doppler

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

USER nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

# Runtime secrets injection
ENTRYPOINT ["doppler", "run", "--"]
CMD ["node", "server.js"]