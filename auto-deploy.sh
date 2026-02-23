#!/bin/bash

# 足球聯賽管理系統 - 自動 Vercel 部署腳本
# 這個腳本會自動部署你的專案到 Vercel

echo "🚀 開始自動部署到 Vercel..."

# 設置顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：打印彩色訊息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    print_error "請在專案根目錄執行此腳本"
    exit 1
fi

# 檢查是否已安裝 Vercel CLI
if ! command -v vercel &> /dev/null; then
    print_info "正在安裝 Vercel CLI..."
    npm install -g vercel
fi

print_info "正在準備部署配置..."

# 創建優化的 Vercel 配置
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "env": {
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
EOF

print_success "Vercel 配置已創建"

# 創建 .env.production 文件
cat > .env.production << 'EOF'
# 生產環境配置
NEXTAUTH_URL=
NEXTAUTH_SECRET=your-very-secure-secret-key-change-this-in-production
EOF

print_info "請輸入以下資訊來完成部署："

# 詢問專案名稱
read -p "請輸入專案名稱 (例如: football-league-system): " PROJECT_NAME
if [ -z "$PROJECT_NAME" ]; then
    PROJECT_NAME="football-league-system"
fi

# 詢問環境變量
read -p "請輸入生產環境的 NEXTAUTH_URL (例如: https://your-app.vercel.app): " NEXTAUTH_URL
if [ -z "$NEXTAUTH_URL" ]; then
    print_warning "未提供 NEXTAUTH_URL，將在部署後手動配置"
fi

# 生成安全的密鑰
SECRET_KEY=$(openssl rand -base64 32 2>/dev/null || date | md5)

print_info "正在更新環境變量..."
# 更新 .env.production
cat > .env.production << EOF
NEXTAUTH_URL=$NEXTAUTH_URL
NEXTAUTH_SECRET=$SECRET_KEY
EOF

print_info "正在構建專案..."
npm run build

if [ $? -ne 0 ]; then
    print_error "構建失敗，請檢查錯誤訊息"
    exit 1
fi

print_success "構建成功！"

print_info "正在初始化 Vercel 專案..."

# 創建 vercel 配置文件夾
mkdir -p .vercel

# 執行 Vercel 部署
echo ""
print_info "即將開始 Vercel 部署..."
echo "如果這是第一次部署，請在瀏覽器中完成授權流程"
echo ""

# 使用 Vercel CLI 部署
vercel --prod --name=$PROJECT_NAME --yes

if [ $? -eq 0 ]; then
    print_success "🎉 部署成功！"
    print_info "請記住以下登入資訊："
    echo ""
    echo "管理員帳號："
    echo "  電郵：admin@football.com"
    echo "  密碼：password"
    echo ""
    echo "用戶帳號："
    echo "  電郵：user@football.com"
    echo "  密碼：password"
    echo ""
    print_info "重要提醒："
    echo "1. 請在 Vercel 控制台中設置正確的環境變量"
    echo "2. 更新 NEXTAUTH_URL 為你的實際域名"
    echo "3. 考慮更改預設密碼以提高安全性"
else
    print_error "部署失敗，請檢查錯誤訊息並重試"
    exit 1
fi

print_success "自動部署完成！"