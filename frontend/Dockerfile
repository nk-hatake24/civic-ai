# --- STAGE 1: Base ---
FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && \
    apk add --no-cache libc6-compat curl && \
    curl -sLf --retry 3 --tlsv1.2 --proto "=https" \
        'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' \
        -o /etc/apk/keys/doppler-alpine.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' \
        >> /etc/apk/repositories && \
    apk add --no-cache doppler

WORKDIR /app


# --- STAGE 2: Dependencies ---
FROM base AS deps

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile


# --- STAGE 3: Builder ---
FROM deps AS builder

COPY . .

RUN pnpm build


# --- STAGE 4: Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache libc6-compat curl && \
    curl -sLf --retry 3 --tlsv1.2 --proto "=https" \
        'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' \
        -o /etc/apk/keys/doppler-alpine.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' \
        >> /etc/apk/repositories && \
    apk add --no-cache doppler

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

USER nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

ENTRYPOINT ["doppler", "run", "--"]
CMD ["node", "server.js"]