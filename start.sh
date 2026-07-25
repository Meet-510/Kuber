#!/usr/bin/env bash
# NeoBanking — full startup script (macOS / Linux)
set -e

CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo ""
echo -e "${MAGENTA} ███╗   ██╗███████╗ ██████╗ ${RESET}"
echo -e "${MAGENTA} ████╗  ██║██╔════╝██╔═══██╗${RESET}"
echo -e "${MAGENTA} ██╔██╗ ██║█████╗  ██║   ██║${RESET}"
echo -e "${MAGENTA} ██║╚██╗██║██╔══╝  ██║   ██║${RESET}"
echo -e "${MAGENTA} ██║ ╚████║███████╗╚██████╔╝${RESET}"
echo -e "${MAGENTA} ╚═╝  ╚═══╝╚══════╝ ╚═════╝  Banking${RESET}"
echo ""

# ── Check Node.js ──────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo -e "${RED} [ERROR] Node.js not found. Install from https://nodejs.org${RESET}"
  exit 1
fi
echo -e "${GREEN} [OK] Node.js $(node -v)${RESET}"

# ── Check MongoDB ──────────────────────────────────────────────────────────────
if command -v mongod &>/dev/null; then
  echo -e "${GREEN} [OK] mongod found${RESET}"
else
  echo -e "${YELLOW} [WARN] mongod not found in PATH. Make sure MongoDB is running.${RESET}"
fi

# ── Run setup wizard ───────────────────────────────────────────────────────────
echo ""
echo " Running setup wizard..."
echo " ─────────────────────────────────────────────────────────"
node setup.js

# ── Install root concurrently ──────────────────────────────────────────────────
echo ""
echo " Installing root dev tools..."
npm install --silent

# ── Launch ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN} ─────────────────────────────────────────────────────────${RESET}"
echo -e "${CYAN} Backend  →  http://localhost:4000/graphql${RESET}"
echo -e "${CYAN} Frontend →  http://localhost:5173${RESET}"
echo -e "${CYAN} ─────────────────────────────────────────────────────────${RESET}"
echo ""
echo " Press Ctrl+C to stop."
echo ""

npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "magenta,cyan" \
  --kill-others-on-fail \
  "npm run dev --prefix backend" \
  "npm run dev --prefix frontend"
