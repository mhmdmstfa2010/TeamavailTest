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

## Quick Start

```
# 1) Create .env (see Environment)
# 2) Run the local CI/CD pipeline
bash ci.sh

# 3) Open the app
xdg-open http://localhost:3000 || open http://localhost:3000 || true
```

To stop services:
```
docker compose down
```

## Healthcheck

- Endpoint: `GET /healthz` returns `{ status: "ok" }`
- Compose uses this endpoint for container health status
- Redis healthcheck: `redis-cli -a "$REDIS_PASSWORD" ping` must return `PONG`
- App waits for Redis to be healthy (`depends_on: condition: service_healthy`)

## Running App Screenshot

![Running App](pics/Screenshot%20from%202025-09-18%2016-42-19.png)

## Data Persistence

- App history persisted in Redis key `history`
- Also mirrored to `./output/history.json` via a bind mount

## Development Notes

- `server.js` exposes `GET /history` and `POST /save-history`
- Frontend fetches `/history` instead of the static file
- `GET /healthz` added for healthchecks

## Testing

- Jest + Supertest tests cover:
  - `GET /healthz`
  - `POST /save-history` (file fallback) and `GET /history`
- Tests isolate filesystem writes via `OUTPUT_DIR` env var

## Environment Variables

| Name            | Default  | Purpose                                   |
|-----------------|----------|-------------------------------------------|
| `REDIS_HOST`    | `redis`  | Hostname of Redis service                 |
| `REDIS_PORT`    | `6379`   | Redis port                                |
| `REDIS_PASSWORD`| `changeme` | Redis authentication password            |
| `OUTPUT_DIR`    | `./output` (runtime) | Alternate output dir (tests) |

Note: `.env` is used by Docker Compose; do not commit secrets.

## CI/CD Pipeline (ci.sh)

Steps executed locally:
- Sanity check (presence of `package.json`)
- Install deps (`npm ci` or `npm install`)
- Format (`prettier`), Lint (`eslint`), Test (`jest`)
- Security audit (`npm audit`) — non-blocking
- Build Docker image (multi-stage, Node Alpine, non-root, production env)
- Start stack with Docker Compose (app + redis + healthchecks)

## Troubleshooting

- Port 3000 or 6379 already in use:
  - Stop existing services or change host port mapping in `docker-compose.yml`.

- Redis auth errors (NOAUTH):
  - Ensure `.env` has `REDIS_PASSWORD` and both services use the same value.

- Permission denied writing `history.json`:
  - Fixed via Dockerfile ownership and `./output:/app/output` bind mount. Ensure the host `output/` exists and is writable.

- Tests fail due to Redis during local runs:
  - Tests run with `NODE_ENV=test` and don’t require Redis. Re-run with `npm test` inside the project directory.

## Implementation Details & Personal Notes

- Redis integration: I added code in `server.js` and `package.json` to connect the app to Redis (using the `redis` client), store history in a Redis key, and keep a file fallback for local persistence.
- Issue encountered: I initially hit a permission error (EACCES) writing to `/app/output/history.json` inside the container. I fixed it by adjusting the `Dockerfile` to create/chown `/app/output` for the non-root user and by bind-mounting `./output:/app/output` in `docker-compose.yml`.
- CI script: I built the core logic of `ci.sh` myself (sanity checks, install, format, lint, test, audit, build, compose up). I later asked AI to suggest minor syntax/consistency improvements (e.g., standardizing on `docker compose`).
- Security: I use a `.env` file for Redis credentials to avoid hardcoding secrets when hosting code on GitHub.
- Linting: I wrote the ESLint setup from scratch to enable the linting stage.
- Images: I used Alpine-based Node images and a multi-stage build to keep the final image lightweight.

## Architecture

```mermaid
flowchart LR
  U[User] -->|HTTP 3000| B[Browser (Frontend)]
  B -->|/history, /save-history| A[Express App (server.js)]
  A -->|GET/SET key "history"| R[(Redis)]
  A -->|File fallback| F[/./output/history.json/]

  subgraph Docker Compose
    A
    R
    F
  end

  subgraph Healthchecks
    H1[GET /healthz -> 200]
    H2[redis-cli -a $REDIS_PASSWORD ping -> PONG]
  end

  H1 -.-> A
  H2 -.-> R

  note over A,F: Bind mount ./output -> /app/output
```
