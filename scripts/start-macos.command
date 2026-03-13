#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

log() {
  printf '[wp5-launcher] %s\n' "$*"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

ensure_env_file() {
  if [[ ! -f .env ]]; then
    if [[ -f .env.example ]]; then
      cp .env.example .env
      log "Created .env from .env.example"
    else
      log "Missing .env and .env.example"
      exit 1
    fi
  fi
}

env_value() {
  local key="$1"
  local env_file="${2:-.env}"
  if [[ ! -f "$env_file" ]]; then
    return 0
  fi
  awk -F= -v key="$key" '
    $0 ~ /^[[:space:]]*#/ {next}
    $1 == key {
      sub(/^[[:space:]]+/, "", $2)
      sub(/[[:space:]]+$/, "", $2)
      gsub(/^"|"$/, "", $2)
      gsub(/^\047|\047$/, "", $2)
      print $2
      exit
    }
  ' "$env_file"
}

# ── First-time setup wizard ───────────────────────────────────────────────────

set_env_value() {
  local key="$1" value="$2" file="${3:-.env}"
  local tmp; tmp="$(mktemp)"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    awk -v k="$key" -v v="$value" -F= 'BEGIN{OFS="="} $1==k{$2=v; print; next} {print}' "$file" > "$tmp"
    mv "$tmp" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

needs_setup() {
  local keys=("ANTHROPIC_API_KEY" "HF_API_KEY" "GEMINI_API_KEY" "MISTRAL_API_KEY" "KONSTANZ_API_KEY")
  for key in "${keys[@]}"; do
    local val; val="$(env_value "$key" .env)"
    if [[ -n "$val" && "$val" != "your_api_key_here" ]]; then
      return 1
    fi
  done
  return 0
}

run_setup_wizard() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║          WP5 Platform — First-time Setup                   ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  You need at least ONE API key to run the platform."
  echo "  You can change these later by editing the .env file."
  echo ""

  local current_pass; current_pass="$(env_value ADMIN_PASSPHRASE .env)"
  if [[ -z "$current_pass" || "$current_pass" == "changeme" ]]; then
    echo "── Admin panel password ──────────────────────────────────────"
    echo "  This is the password to access the researcher admin panel."
    read -rp "  Choose a password (Enter to keep 'changeme'): " admin_pass
    if [[ -n "$admin_pass" ]]; then
      set_env_value "ADMIN_PASSPHRASE" "$admin_pass"
      echo "  ✓ Password saved."
    fi
    echo ""
  fi

  echo "── LLM API Keys ──────────────────────────────────────────────"
  echo "  Enter keys for the providers you want to use."
  echo "  Press Enter to skip any provider."
  echo ""

  local providers=(
    "ANTHROPIC_API_KEY|Anthropic (Claude) — Director agent (recommended)|https://console.anthropic.com/"
    "HF_API_KEY|HuggingFace — Performer agents (chat bots)|https://huggingface.co/settings/tokens"
    "GEMINI_API_KEY|Google Gemini — alternative provider|https://aistudio.google.com/app/apikey"
    "MISTRAL_API_KEY|Mistral — alternative provider|https://console.mistral.ai/api-keys"
    "KONSTANZ_API_KEY|Konstanz vLLM — university-hosted model|(contact your institution)"
  )

  local i=1
  for entry in "${providers[@]}"; do
    IFS='|' read -r key label url <<< "$entry"
    local current; current="$(env_value "$key" .env)"
    if [[ -n "$current" && "$current" != "your_api_key_here" ]]; then
      echo "  [$i] $label — already set, skipping."
      echo ""
    else
      echo "  [$i] $label"
      echo "      Get key: $url"
      read -rp "      $key: " key_val
      if [[ -n "$key_val" ]]; then
        set_env_value "$key" "$key_val"
        echo "      ✓ Saved."
      fi
      echo ""
    fi
    i=$((i + 1))
  done

  if needs_setup; then
    echo "  ⚠  No API key was provided. The platform will not work without at least one."
    echo "     You can add keys later by editing the .env file in the project folder."
    echo ""
    read -rp "  Continue anyway? (y/N): " cont
    if [[ "${cont,,}" != "y" ]]; then
      exit 1
    fi
  else
    echo "  ✓ Setup complete — this wizard will not appear again."
  fi
  echo ""
}

install_docker_macos() {
  log "Docker not found. Trying automatic install with Homebrew..."
  if ! command_exists brew; then
    log "Homebrew is required for automatic install. Install it from https://brew.sh and rerun."
    exit 1
  fi
  brew install --cask docker
}

ensure_docker() {
  if ! command_exists docker; then
    install_docker_macos
  fi

  if ! docker compose version >/dev/null 2>&1; then
    log "docker compose plugin is unavailable. Reinstall Docker Desktop and rerun."
    exit 1
  fi
}

ensure_docker_running() {
  if docker info >/dev/null 2>&1; then
    return
  fi

  log "Starting Docker Desktop..."
  open -a Docker || true

  local tries=0
  until docker info >/dev/null 2>&1; do
    tries=$((tries + 1))
    if (( tries > 60 )); then
      log "Docker daemon is not running. Start Docker Desktop and rerun this script."
      exit 1
    fi
    sleep 2
  done
}

wait_http() {
  local url="$1"
  local tries=0
  until curl -fsS "$url" >/dev/null 2>&1; do
    tries=$((tries + 1))
    if (( tries > 90 )); then
      log "Timeout waiting for $url"
      return 1
    fi
    sleep 2
  done
}

main() {
  ensure_env_file
  if needs_setup; then
    run_setup_wizard
  fi
  ensure_docker
  ensure_docker_running

  log "Starting platform with docker compose..."
  docker compose up -d --build

  local frontend_port app_port
  frontend_port="$(env_value FRONTEND_PORT .env)"
  app_port="$(env_value APP_PORT .env)"
  frontend_port="${frontend_port:-3000}"
  app_port="${app_port:-8000}"

  local admin_url="http://localhost:${frontend_port}/admin"
  local domain
  domain="$(env_value DOMAIN .env)"
  local participant_url="http://localhost:${frontend_port}"
  if [[ -n "$domain" && "$domain" != "localhost" ]]; then
    participant_url="https://${domain}"
  fi

  log "Waiting for frontend and backend..."
  wait_http "http://localhost:${frontend_port}" || true
  wait_http "http://localhost:${app_port}/health" || true

  open "$admin_url" || true
  open "$participant_url" || true

  local admin_pass
  admin_pass="$(env_value ADMIN_PASSPHRASE .env)"
  if [[ -z "$admin_pass" ]]; then
    admin_pass="$(env_value ADMIN_PASSPHRASE .env.example)"
  fi

  log "Admin URL: $admin_url"
  log "Participant URL: $participant_url"
  log "Initial admin password: ${admin_pass:-<not set>}"
}

main "$@"

echo ""
read -rp "Press Enter to close this window..."
