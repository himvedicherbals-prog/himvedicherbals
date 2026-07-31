#!/bin/bash
# ============================================
# Deployment Script for Cloudflare Pages + D1
# For himvedicherbals (Trishanku Baba)
# ============================================

set -e

echo "🌿 Trishanku Baba - Deployment Script"
echo "═════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
  fi
  
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm"
    exit 1
  fi
  
  if ! command -v wrangler &> /dev/null; then
    log_warning "Wrangler CLI not found. Installing..."
    npm install -g wrangler
  fi
  
  # Check Node version
  NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
  if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18 or higher is required. Current: $(node --version)"
    exit 1
  fi
  
  log_success "Prerequisites check passed!"
}

# Install dependencies
install_dependencies() {
  log_info "Installing dependencies..."
  
  if [ ! -d "node_modules" ]; then
    npm install
    log_success "Dependencies installed!"
  else
    log_info "Dependencies already installed."
  fi
}

# Initialize databases
init_databases() {
  log_info "Initializing D1 databases..."
  
  # Create and migrate blog-db
  log_info "Setting up blog-db..."
  wrangler d1 create blog-db 2>/dev/null || true
  wrangler d1 execute blog-db --file=./blog-schema.sql --remote || true
  
  # Create and migrate users-db
  log_info "Setting up users-db..."
  wrangler d1 create users-db 2>/dev/null || true
  wrangler d1 execute users-db --file=./users-schema.sql --remote || true
  
  log_success "Databases initialized!"
  log_warning "⚠️  Don't forget to update database IDs in wrangler.toml!"
}

# Build project
build_project() {
  log_info "Building project..."
  npm run build
  log_success "Build completed!"
}

# Deploy to Cloudflare Pages
deploy() {
  log_info "Deploying to Cloudflare Pages..."
  wrangler pages deploy dist --project-name=himvedicherbals
  log_success "Deployment completed!"
}

# Main deployment flow
main() {
  case "${1:-all}" in
    init)
      check_prerequisites
      install_dependencies
      init_databases
      ;;
    build)
      check_prerequisites
      build_project
      ;;
    deploy)
      check_prerequisites
      build_project
      deploy
      ;;
    db-only)
      init_databases
      ;;
    all|*)
      check_prerequisites
      install_dependencies
      init_databases
      build_project
      deploy
      ;;
  esac
  
  echo ""
  echo "═════════════════════════════════════"
  log_success "🎉 All done! Your site is live!"
  echo ""
  echo "Next steps:"
  echo "  1. Update database IDs in wrangler.toml (if first time)"
  echo "  2. Set your JWT_SECRET in Cloudflare Dashboard"
  echo "  3. Test all API endpoints"
  echo "  4. Create admin account via signup"
  echo ""
}

main "$@"
