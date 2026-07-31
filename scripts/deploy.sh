#!/usr/bin/env bash
#
# One-click deployment script for Trishanku Baba
# Usage: chmod +x scripts/deploy.sh && ./scripts/deploy.sh
#

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🌿 Trishanku Baba — Deploy to Cloudflare   ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo "  ✅ Node.js $(node -v)"

if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Run: npm install -g wrangler${NC}"
    exit 1
fi
echo "  ✅ Wrangler CLI"

# Check wrangler login
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare. Running wrangler login...${NC}"
    wrangler login
fi
echo "  ✅ Logged in to Cloudflare"
echo ""

# Check for placeholder database IDs
if grep -q "PASTE_YOUR_" wrangler.toml 2>/dev/null; then
    echo -e "${RED}❌ wrangler.toml still has placeholder database IDs!${NC}"
    echo -e "${YELLOW}   Run: node scripts/init-databases.js${NC}"
    echo -e "${YELLOW}   Then update wrangler.toml with the real IDs.${NC}"
    exit 1
fi

# Check JWT_SECRET
if grep -q "CHANGE-THIS-TO-A-RANDOM" wrangler.toml 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: JWT_SECRET is still the default value!${NC}"
    echo -e "${YELLOW}   Change it in wrangler.toml or use: wrangler secret put JWT_SECRET${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build
echo -e "${GREEN}📦 Building project...${NC}"
npm run build
echo ""

# Deploy
echo -e "${GREEN}🚀 Deploying to Cloudflare Pages...${NC}"
wrangler pages deploy dist --project-name=himvedicherbals

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deployment complete!                     ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"