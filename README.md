# Team Availability Tracker - Local CI/CD Pipeline

## Prerequisites

- Docker and Docker Compose (Docker CLI v20+ with `docker compose`)
- Node.js (optional if you only use Docker)

## Environment

Create a `.env` file (Compose reads it automatically):

```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=changeme
```

## Run the Pipeline

```
bash ci.sh
```

The script will:

- Install dependencies
- Format, lint, and test the app
- Run an npm audit (non-blocking)
- Build the Docker image
- Start services with Docker Compose

Open http://localhost:3000

## Services

- App: http://localhost:3000
- Redis: localhost:6379

## Running App Screenshot
![Running App](pics/Screenshot%20from%202025-09-18%2016-42-19.png)

## Data Persistence

- App history persisted in Redis key `history`
- Also mirrored to `./output/history.json` via a bind mount

## Development Notes

- `server.js` exposes `GET /history` and `POST /save-history`
- Frontend fetches `/history` instead of the static file

## Implementation Details & Personal Notes
- Redis integration: I added code in `server.js` and `package.json` to connect the app to Redis (using the `redis` client), store history in a Redis key, and keep a file fallback for local persistence.
- Issue encountered: I initially hit a permission error (EACCES) writing to `/app/output/history.json` inside the container. I fixed it by adjusting the `Dockerfile` to create/chown `/app/output` for the non-root user and by bind-mounting `./output:/app/output` in `docker-compose.yml`.
- CI script: I built the core logic of `ci.sh` myself (sanity checks, install, format, lint, test, audit, build, compose up). I later asked AI to suggest minor syntax/consistency improvements (e.g., standardizing on `docker compose`).
- Security: I use a `.env` file for Redis credentials to avoid hardcoding secrets when hosting code on GitHub.
- Linting: I wrote the ESLint setup from scratch to enable the linting stage.
- Images: I used Alpine-based Node images and a multi-stage build to keep the final image lightweight.
