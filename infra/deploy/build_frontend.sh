#!/usr/bin/env bash
# build_frontend.sh — robust frontend build helper for ClinicQ
# Works on typical VPS environments; detects package manager; handles env files; prints build artifacts path.

set -Eeuo pipefail

# ==== CONFIG (edit if your paths differ) ====
PROJECT_DIR="${PROJECT_DIR:-/srv/clinicq}"                 # Root directory of your project on the server
FRONTEND_DIR="${FRONTEND_DIR:-$PROJECT_DIR/clinicq_frontend}"  # React/Next/Vite project directory
NODE_MEMORY_MB="${NODE_MEMORY_MB:-2048}"                   # Increase if builds OOM (e.g., 4096)

echo "=== ClinicQ Frontend Build ==="
echo "Project dir : $PROJECT_DIR"
echo "Frontend dir: $FRONTEND_DIR"
echo

# ---- 0) Sanity checks ----
if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "ERROR: Frontend directory not found: $FRONTEND_DIR"
  exit 1
fi

# Ensure we have basic tools
need() { command -v "$1" >/dev/null 2>&1 || { echo "ERROR: Missing required command: $1"; exit 1; }; }
need bash
need sed

# ---- 1) Node & package manager detection ----
# Try to ensure Node is available (nvm fallback if present)
if ! command -v node >/dev/null 2>&1; then
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    nvm use --lts >/dev/null 2>&1 || true
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js not found. Install Node (e.g., via nvm or apt) and retry."
  exit 1
fi

echo "Node: $(node -v)"
export NODE_OPTIONS="--max-old-space-size=${NODE_MEMORY_MB}"

# Prefer pnpm or yarn if lockfiles exist; default to npm otherwise
PKG_MGR="npm"
LOCK_INFO="package-lock.json"
if [[ -f "$FRONTEND_DIR/pnpm-lock.yaml" ]]; then
  PKG_MGR="pnpm"
  LOCK_INFO="pnpm-lock.yaml"
elif [[ -f "$FRONTEND_DIR/yarn.lock" ]]; then
  PKG_MGR="yarn"
  LOCK_INFO="yarn.lock"
fi

# Enable corepack for Yarn/Pnpm if available (Node >=16.10)
if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
fi

echo "Package manager: $PKG_MGR (lock: $LOCK_INFO)"
echo

# ---- 2) Install deps ----
cd "$FRONTEND_DIR"

export CI=1

case "$PKG_MGR" in
  pnpm)
    need pnpm
    echo "[1/3] Installing dependencies with pnpm (frozen lockfile)"
    pnpm install --frozen-lockfile
    BUILD_CMD="pnpm run build"
    ;;
  yarn)
    need yarn
    echo "[1/3] Installing dependencies with yarn (frozen lockfile)"
    yarn install --frozen-lockfile
    BUILD_CMD="yarn build"
    ;;
  npm|*)
    need npm
    if [[ -f package-lock.json ]]; then
      echo "[1/3] Installing dependencies with npm ci"
      npm ci
    else
      echo "[1/3] Installing dependencies with npm install (no package-lock.json found)"
      npm install
    fi
    BUILD_CMD="npm run build"
    ;;
esac

# ---- 3) Env handling ----
# If .env.production exists and .env is missing, copy for build tools that rely on .env
if [[ -f ".env.production" && ! -f ".env" ]]; then
  echo "[2/3] Applying .env.production -> .env for build"
  cp .env.production .env
fi

# ---- 4) Build ----
echo "[3/3] Building the frontend"
set +e
$BUILD_CMD
BUILD_RC=$?
set -e
if [[ $BUILD_RC -ne 0 ]]; then
  echo "ERROR: Build failed (exit $BUILD_RC). Check logs above."
  exit $BUILD_RC
fi

# ---- 5) Locate artifacts (CRA=build/, Vite=dist/, Next=.next/) ----
ARTIFACT_DIR=""
if [[ -d "dist" ]]; then
  ARTIFACT_DIR="dist"
elif [[ -d "build" ]]; then
  ARTIFACT_DIR="build"
elif [[ -d ".next" ]]; then
  ARTIFACT_DIR=".next"
else
  # Try common output hints from package.json scripts without jq
  if grep -qi "vite" package.json 2>/dev/null; then ARTIFACT_DIR="dist"; fi
  if grep -qi "react-scripts" package.json 2>/dev/null; then ARTIFACT_DIR="build"; fi
fi

if [[ -n "$ARTIFACT_DIR" && -d "$ARTIFACT_DIR" ]]; then
  echo
  echo "--- Build Complete ---"
  echo "Artifacts: $FRONTEND_DIR/$ARTIFACT_DIR"
  # Show a brief size summary if 'du' present
  if command -v du >/dev/null 2>&1; then
    du -sh "$ARTIFACT_DIR" || true
  fi
else
  echo
  echo "WARNING: Build finished but could not detect an artifact directory (dist/build/.next)."
  echo "Check your framework’s configured output path."
fi

# ---- 6) Post-notes ----
cat <<'NOTE'

Notes:
- If serving static files (Vite/CRA), point your web server (e.g., nginx) to the artifact directory above.
- If using Next.js, you likely want:  `npm run build && npm run start`  behind a process manager (pm2/systemd).
- Make this script executable:      chmod +x build_frontend.sh
- Run with custom paths:            PROJECT_DIR=/opt/clinicq FRONTEND_DIR=/opt/clinicq/clinicq_frontend ./build_frontend.sh
- Increase memory if builds OOM:    NODE_MEMORY_MB=4096 ./build_frontend.sh

NOTE

echo "=== Done ==="
