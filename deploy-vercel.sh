#!/bin/bash

# 足球聯賽管理系統 - Vercel 部署腳本

echo "🚀 開始部署足球聯賽管理系統到 Vercel..."

# 確保我們在正確的目錄
cd /Users/sallychan/Desktop/AI_ZENEX_CUP/web

# 更新 package.json 中的腳本
cat > package.json << 'EOF'
{
  "name": "football-league-system",
  "version": "1.0.0",
  "description": "Professional Football League Management System",
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "vercel-build": "next build"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "next": "16.1.6",
    "next-auth": "^4.24.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.2",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
EOF

echo "✅ Package.json 已更新"

# 創建 Vercel 配置文件
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
    "NEXTAUTH_URL": "https://your-domain.vercel.app",
    "NEXTAUTH_SECRET": "your-generated-secret-key"
  }
}
EOF

echo "✅ Vercel 配置已完成"
echo ""
echo "📋 部署步驟："
echo "1. 登入 Vercel: https://vercel.com"
echo "2. 點擊 'New Project'"
echo "3. 選擇 'Import Git Repository' 或直接上傳檔案"
echo "4. 設定專案名稱 (例如: football-league-system)"
echo "5. 點擊 'Deploy'"
echo ""
echo "🔑 預設登入帳號："
echo "   管理員: admin@football.com / password"
echo "   用戶: user@football.com / password"
echo ""
echo "🌐 部署後記得在 Vercel 專案設定中更新 NEXTAUTH_URL 和 NEXTAUTH_SECRET！"