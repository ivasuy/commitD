ARG PORT=3000

FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package.json ./
RUN npm install


FROM node:20-bookworm-slim AS builder

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN [ -f .env ] || [ -f .env.local ] || touch .env

RUN npm run build


FROM node:20-bookworm-slim AS runner

ARG PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=${PORT}
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.env ./.env

USER nextjs

EXPOSE ${PORT}

CMD ["sh", "-c", "set -a; [ -f /app/.env ] && . /app/.env; [ -f /app/.env.local ] && . /app/.env.local; set +a; exec node server.js"]
