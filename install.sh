#!/usr/bin/env bash
# ==============================================================================
# Personal AI Workspace — Automated Installer
# Target: Ubuntu Server 24.04 LTS / Debian 12 / Docker Compose systems
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${CYAN}[INFO]${NC} $*"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

echo -e "${BOLD}====================================================================${NC}"
echo -e "${BOLD}         Personal AI Workspace — System Installation Wizard         ${NC}"
echo -e "${BOLD}====================================================================${NC}"

# 1. System Requirements Verification
log_info "Verifying host prerequisites..."

# Check OS architecture
ARCH="$(uname -m)"
if [[ "${ARCH}" != "x86_64" && "${ARCH}" != "aarch64" ]]; then
    log_error "Unsupported architecture: ${ARCH}. Personal AI Workspace requires x86_64 or aarch64."
    exit 1
fi
log_ok "Architecture: ${ARCH}"

# Check available memory (RAM)
if [[ -f /proc/meminfo ]]; then
    TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
    if [[ ${TOTAL_RAM_MB} -lt 3500 ]]; then
        log_warn "Host RAM is ${TOTAL_RAM_MB} MB. Recommended minimum is 4096 MB for cloud models, 16384 MB for local models."
    else
        log_ok "Memory: ${TOTAL_RAM_MB} MB RAM detected."
    fi
fi

# Check Docker installation
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed or not in PATH."
    echo "To install Docker on Ubuntu, run:"
    echo "  curl -fsSL https://get.docker.com | sh"
    echo "  sudo usermod -aG docker \$USER"
    exit 1
fi
log_ok "Docker executable found: $(docker --version)"

# Check Docker Compose (v2)
if ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose v2 ('docker compose') is required."
    exit 1
fi
log_ok "Docker Compose found: $(docker compose version --short)"

# Check Docker daemon connectivity
if ! docker info >/dev/null 2>&1; then
    log_error "Cannot connect to the Docker daemon. Is Docker running?"
    echo "Try: sudo systemctl start docker"
    exit 1
fi
log_ok "Docker daemon is reachable and responding."

# Check NVIDIA GPU support (optional, Legion 5 RTX 2060 target)
if command -v nvidia-smi >/dev/null 2>&1; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -n 1 || echo "Unknown")
    log_ok "NVIDIA GPU detected: ${GPU_NAME}. compose.gpu.yaml profile can be enabled."
else
    log_info "No NVIDIA GPU detected. Standard CPU/cloud provider mode will be used."
fi

# 2. Storage Setup
log_info "Setting up local persistent data directories..."
mkdir -p data/open-webui data/paw/library data/paw/sqlite data/paw/artifacts backups
chmod 700 data backups
log_ok "Data directories initialized."

# 3. Environment Configuration Generation
ENV_FILE=".env"
if [[ -f "${ENV_FILE}" ]]; then
    log_info "Existing ${ENV_FILE} found. Preserving existing secrets."
else
    log_info "Creating ${ENV_FILE} from template..."
    cp .env.example "${ENV_FILE}"
    
    # Generate cryptographic random secrets
    GEN_WEBUI_SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || openssl rand -hex 32)
    GEN_PAW_SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || openssl rand -hex 32)
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/WEBUI_SECRET_KEY=.*/WEBUI_SECRET_KEY=${GEN_WEBUI_SECRET}/" "${ENV_FILE}"
        sed -i '' "s/PAW_SESSION_SECRET=.*/PAW_SESSION_SECRET=${GEN_PAW_SECRET}/" "${ENV_FILE}"
    else
        sed -i "s/WEBUI_SECRET_KEY=.*/WEBUI_SECRET_KEY=${GEN_WEBUI_SECRET}/" "${ENV_FILE}"
        sed -i "s/PAW_SESSION_SECRET=.*/PAW_SESSION_SECRET=${GEN_PAW_SECRET}/" "${ENV_FILE}"
    fi
    chmod 600 "${ENV_FILE}"
    log_ok "Generated secure random keys for WEBUI_SECRET_KEY and PAW_SESSION_SECRET."
fi

# 4. Port Check
check_port() {
    local port=$1
    if command -v ss >/dev/null 2>&1; then
        ss -tuln | grep -q ":${port} " && return 1 || return 0
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep -q ":${port} " && return 1 || return 0
    else
        return 0
    fi
}

PAW_PORT="${PAW_PORT:-3000}"
OPENWEBUI_PORT="${OPENWEBUI_PORT:-3001}"

if ! check_port "${PAW_PORT}"; then
    log_warn "Port ${PAW_PORT} appears to be already in use on host. You can adjust PAW_PORT in .env."
fi
if ! check_port "${OPENWEBUI_PORT}"; then
    log_warn "Port ${OPENWEBUI_PORT} appears to be already in use on host. You can adjust OPENWEBUI_PORT in .env."
fi

# 5. Start Container Stack
log_info "Validating compose configuration..."
docker compose config -q
log_ok "Compose syntax verified."

if [[ "${1:-}" == "--pull-and-start" ]]; then
    log_info "Pulling images and starting services in background..."
    docker compose up -d
    log_ok "Personal AI Workspace services launched."
    echo ""
    echo -e "${GREEN}${BOLD}Installation Complete!${NC}"
    echo "  - Web App (PAW Unified UI):  http://localhost:${PAW_PORT}"
    echo "  - Open WebUI (Admin Direct):  http://localhost:${OPENWEBUI_PORT}"
    echo ""
    echo "Run './manage.sh status' to monitor health and containers."
else
    echo ""
    echo -e "${GREEN}${BOLD}Setup completed successfully!${NC}"
    echo "To start Personal AI Workspace now, run:"
    echo "  ./manage.sh start"
    echo ""
    echo "Or start directly via Compose:"
    echo "  docker compose up -d"
fi
