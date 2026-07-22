FROM node:20 AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── Dependências (camada cacheada) ───────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# ── Desenvolvimento ──────────────────────────────────────────────────────────
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules

# ── Build de produção ────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
COPY tsconfig.base.json ./
RUN pnpm install
RUN pnpm -r build

# ── Produção (imagem enxuta) ─────────────────────────────────────────────────
FROM node:20-slim AS prod
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/db/migrations ./apps/api/src/db/migrations
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
ENV NODE_ENV=production
EXPOSE 3333
CMD ["node", "apps/api/dist/server.js"]
