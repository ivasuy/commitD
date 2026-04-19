# DOCKER GUIDE

## OVERVIEW

This repository has two services:

- `dashboard` (root app) on `3001`
- `landing` (`landing/` app) on `3000`

Both services are orchestrated by `docker-compose.yml`.

## PREREQUISITES

- Docker
- Docker Compose
- Root env file (`.env` or `.env.local`) configured from `.env.example`

Optional:

- `landing/.env.local` with `NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001`

## RUN BOTH SERVICES

Build and run:

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

## RUN SINGLE SERVICE

Dashboard only:

```bash
docker compose up --build dashboard
```

Landing only:

```bash
docker compose up --build landing
```

## MANUAL IMAGE BUILDS

```bash
# dashboard image
docker build -t commitd-dashboard:latest .

# landing image
docker build -t commitd-landing:latest -f Dockerfile landing/
```

## SECURITY NOTE

Avoid baking production secrets into image layers. For production, inject runtime secrets through your deployment platform.
