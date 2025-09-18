#!/usr/bin/env bash
set -euo pipefail

echo "==> 1. Sanity check"
if [ ! -f package.json ]; then
  echo "package.json not found. Are you in project root?"
  exit 1
fi

echo "==> 2. Install dependencies"
# Use npm ci if lockfile exists
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> 3. Lint (if script exists)"
if node -e "try{const s=require('./package.json').scripts; process.exit(s && s.lint ? 0 : 1)}catch(e){process.exit(1)}"; then
  npm run lint
else
  echo "No 'lint' script found — skipping lint."
fi

echo "==> 4. Test (if script exists)"
if node -e "try{const s=require('./package.json').scripts; process.exit(s && s.test && s.test !== 'echo \"Error: no test specified\"' ? 0 : 1)}catch(e){process.exit(1)}"; then
  npm test
else
  echo "No tests found — skipping tests."
fi

echo "==> 5. Build Docker image"
docker build -t teamavail:local .

echo "==> 6. Start services with docker-compose"
docker-compose up -d --build

echo "==> Done. Services should be running (check docker ps)."
