# --- STAGE 1: Dependencies ---
# We define a base stage to avoid repeating pnpm installation
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
# We only copy the lockfile and package.json to cache the layer
COPY package.json pnpm-lock.yaml* ./
# frozen-lockfile ensures the build is reproducible
RUN pnpm i --frozen-lockfile

# --- STAGE 2: Builder ---
# We inherit directly FROM deps so we don't have to COPY node_modules manually
FROM deps AS builder
WORKDIR /app

# Install Doppler CLI to bake NEXT_PUBLIC secrets into the JS bundles
RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.2744D481B46951664.key' -O /etc/apk/keys/cli@doppler-2744D481B46951664.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add --no-cache doppler

# Copy source code (node_modules are already here from 'deps')
COPY . .

# Pass Doppler Token to inject secrets during 'next build'
ARG DOPPLER_TOKEN
RUN doppler run -- pnpm build

# --- STAGE 3: Runner ---
# Start fresh for a tiny production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install Doppler CLI for runtime secrets (e.g. DATABASE_URL)
RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.2744D481B46951664.key' -O /etc/apk/keys/cli@doppler-2744D481B46951664.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add --no-cache doppler

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Only copy what we need for Standalone Mode
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["doppler", "run", "--"]
CMD ["node", "server.js"]