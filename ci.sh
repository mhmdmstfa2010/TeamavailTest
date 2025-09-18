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

echo "==> 3. Format code the app"
if node -e "try{const s=require('./package.json').scripts; process.exit(s && s.format ? 0 : 1)}catch(e){process.exit(1)}"; then
  npm run format
else
  echo "No 'format' script found — skipping formatting."
fi

echo "==> 4. Lint the app"
if node -e "try{const s=require('./package.json').scripts; process.exit(s && s.lint ? 0 : 1)}catch(e){process.exit(1)}"; then
  npm run lint
else
  echo "No 'lint' script found — skipping lint."
fi

echo "==> 5. Test the app"
if node -e "try{const s=require('./package.json').scripts; process.exit(s && s.test && s.test !== 'echo \"Error: no test specified\"' ? 0 : 1)}catch(e){process.exit(1)}"; then
  npm test
else
  echo "No tests found — skipping tests."
fi

echo "==> 6. security audit  "
npm audit --production || echo "⚠️  Audit found issues — review required."

echo "🔍 Checking Docker & Docker Compose..."

# 1. Docker running?
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker."
  exit 1
fi

# 2. Docker Compose installed?
if ! command -v docker-compose &> /dev/null; then
  echo "❌ docker-compose is not installed."
  exit 1
fi

# 3. Validate docker-compose.yml
if ! docker-compose config -q; then
  echo "❌ Invalid docker-compose.yml file."
  exit 1
fi
echo "✅ Docker & Docker Compose are installed and running."

echo "==> 7. Build Docker image"
docker build -t teamavail:local .

echo "==> 8. down any running containers and start services with docker-compose"
docker compose down
docker compose up -d --build
echo "==> Done. open http://localhost:3000 to see the app."
