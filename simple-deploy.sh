#!/bin/bash

# 超簡單 Vercel 部署腳本

echo "🏆 足球聯賽管理系統 - 一鍵部署"
echo "================================"

# 1. 創建必要的部署文件
echo "📋 創建部署文件..."

# 創建 .gitignore
cat > .gitignore << 'EOF'
node_modules/
.next/
.env.local
.vercel
*.log
.DS_Store
EOF

# 創建 README
cat > README.md << 'EOF'
# 🏆 足球聯賽管理系統

✨ 專業的足球聯賽管理平台

## 🚀 快速部署

1. 登入 [Vercel](https://vercel.com)
2. 點擊 "New Project"
3. 上傳這個文件夾
4. 設定環境變量：
   - `NEXTAUTH_URL`: 你的應用網址
   - `NEXTAUTH_SECRET`: 隨機密鑰
5. 點擊 "Deploy"

## 🔑 預設帳號
- 管理員: `admin@football.com` / `password`
- 用戶: `user@football.com` / `password`

## ✨ 功能
- ⚽ 即時積分榜
- 📊 賽程管理
- 🔐 安全登入
- 📱 響應式設計
EOF

# 2. 構建項目
echo "🔨 構建項目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 構建成功！"
    echo ""
    echo "🌐 部署步驟："
    echo "1. 前往 https://vercel.com"
    echo "2. 登入你的帳號"
    echo "3. 點擊 'New Project'"
    echo "4. 選擇 'Upload' 並上傳整個文件夾"
    echo "5. 在環境變量中添加："
    echo "   NEXTAUTH_URL=https://your-app-name.vercel.app"
    echo "   NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | head -c 32)"
    echo "6. 點擊 'Deploy'"
    echo ""
    echo "🎉 完成！你的足球聯賽系統就上線了！"
    echo ""
    echo "🔗 登入資訊："
    echo "   管理員: admin@football.com / password"
    echo "   用戶: user@football.com / password"
else
    echo "❌ 構建失敗，請檢查錯誤訊息"
fi