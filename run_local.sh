#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- Load .env ---
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
else
  echo "ERROR: .env file not found."
  echo "Copy .env.example to .env and fill in your settings:"
  echo "  cp .env.example .env"
  exit 1
fi

# --- Install dependencies if needed ---
if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm --prefix "$PROJECT_DIR/frontend" install
fi

if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "Installing backend dependencies..."
  pip3 install -r "$PROJECT_DIR/backend/requirements.txt"
fi

# --- Start backend (FastAPI on port 8099) ---
echo "Starting backend at http://localhost:8099 ..."
echo "Connecting to Baby Buddy at: $BABY_BUDDY_URL"
python3 -m uvicorn backend.server:app \
  --host 0.0.0.0 \
  --port 8099 \
  --log-level info \
  --app-dir "$PROJECT_DIR" &
BACKEND_PID=$!

# --- Start frontend (Vite dev server on port 5173) ---
echo "Starting frontend at http://localhost:5173 ..."
npm --prefix "$PROJECT_DIR/frontend" run dev &
FRONTEND_PID=$!

# --- Cleanup on exit ---
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
}
trap cleanup EXIT INT TERM

echo ""
echo "============================================"
echo "  Dashboard: http://localhost:5173"
echo "  Backend:   http://localhost:8099"
echo "============================================"
echo ""

wait
