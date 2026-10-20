# syntax=docker/dockerfile:1

# ---- build stage ------------------------------------------------------------
FROM node:24-slim AS build

WORKDIR /app

# Install with the lockfile so the image is reproducible. Dev dependencies are
# needed here for vite/esbuild; they are pruned from the runtime image below.
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .

# The client bundle is inlined by vite build; the API is bundled to CJS so the
# runtime image needs no TypeScript toolchain.
RUN npm run build

# Drop dev dependencies from node_modules before it is copied forward.
RUN npm prune --omit=dev


# ---- runtime stage ----------------------------------------------------------
FROM node:24-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# A non-root user: the upload directory and the process should not be writable
# by whatever code path happens to be exploited.
RUN groupadd --system app && useradd --system --gid app --home /app app

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./package.json
# Only the files the server reads at runtime. Note the absence of .env and
# secrets/: credentials must come from Cloud Run's environment, never the image.
COPY --from=build --chown=app:app /app/server.ts ./server.ts
COPY --from=build --chown=app:app /app/firestore.rules ./firestore.rules

RUN mkdir -p /app/uploads && chown -R app:app /app/uploads
USER app

EXPOSE 8080

# Cloud Run and every other scheduler treat a failed health check as a reason to
# stop routing traffic, so the endpoint must answer without touching Firestore.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]
