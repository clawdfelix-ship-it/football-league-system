#!/bin/bash

# GitHub + Vercel 自動部署方案
# 由於 CLI 權限限制，我們使用 GitHub 集成方式

echo "🚀 GitHub + Vercel 自動部署方案"
echo "=================================="

# 創建 Git 倉庫（如果不存在）
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 倉庫..."
    git init
fi

# 創建 .gitignore 文件
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF

# 創建 README 文件
cat > README.md << 'EOF'
# 🏆 足球聯賽管理系統

專業的足球聯賽管理平台，支持積分榜計算、賽程管理和比賽結果記錄。

## 🚀 快速部署到 Vercel

### 方法一：使用 GitHub（推薦）

1. **Fork 這個專案** 到你的 GitHub 帳號
2. **登入 Vercel**：https://vercel.com
3. **點擊 "New Project"**
4. **選擇你的 GitHub 倉庫**
5. **設定環境變量**：
   ```
   NEXTAUTH_URL=https://your-project-name.vercel.app
   NEXTAUTH_SECRET=your-random-secret-key
   ```
6. **點擊 "Deploy"** 🎉

### 方法二：直接上傳

1. **下載這個專案** 為 ZIP 文件
2. **登入 Vercel**：https://vercel.com
3. **點擊 "New Project"**
4. **選擇 "Upload"**
5. **上傳 ZIP 文件**
6. **設定環境變量**（同上）
7. **點擊 "Deploy"** 🎉

## 🔑 預設登入帳號

### 管理員帳號
- **電郵**：`admin@football.com`
- **密碼**：`password`
- **權限**：完整管理權限

### 一般用戶
- **電郵**：`user@football.com`
- **密碼**：`password`
- **權限**：查看賽事資訊

## ✨ 功能特色

- ⚽ **即時積分榜**：自動計算排名和積分
- 📊 **賽程管理**：清晰的比賽時間表
- 🏆 **比賽結果**：完整的賽果記錄
- 🔐 **安全登入**：基於 NextAuth.js 的認證系統
- 📱 **響應式設計**：適配所有設備
- 🎨 **現代化介面**：專業的 UI 設計

## 🛠️ 技術堆疊

- **框架**：Next.js 16.1.6
- **認證**：NextAuth.js
- **樣式**：Tailwind CSS
- **語言**：TypeScript
- **部署**：Vercel

## 🔧 環境變量

創建 `.env.local` 文件：

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## 📞 支援

如有問題，請檢查：
1. 環境變量是否正確設置
2. 構建日誌是否有錯誤
3. Vercel 控制台中的部署狀態

---

**🎯 立即開始你的足球聯賽管理之旅！**
EOF

# 創建部署說明
cat > DEPLOYMENT_GUIDE.md << 'EOF'
# 🚀 部署指南

## 步驟 1：準備 GitHub 倉庫

1. 在 GitHub 上創建新倉庫
2. 將此專案推送到你的倉庫：

```bash
git add .
git commit -m "Initial commit: Football League Management System"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 步驟 2：Vercel 部署

1. **登入 Vercel**：https://vercel.com
2. **點擊 "New Project"**
3. **導入 GitHub 倉庫**
4. **配置環境變量**：
   - `NEXTAUTH_URL`: 你的應用網址
   - `NEXTAUTH_SECRET`: 隨機生成的密鑰

5. **部署完成**！🎉

## 步驟 3：後續更新

每次推送代碼到 GitHub，Vercel 會自動重新部署！

```bash
git add .
git commit -m "Update features"
git push origin main
```

就是這麼簡單！✨
EOF

print_success "✅ 部署文件已創建完成！"
echo ""
echo "📋 接下來的步驟："
echo "1. 創建 GitHub 倉庫"
echo "2. 推送代碼到 GitHub"
echo "3. 在 Vercel 導入 GitHub 倉庫"
echo "4. 設定環境變量"
echo "5. 一鍵部署！"
echo ""
echo "🔗 詳細說明請查看："
echo "   - README.md（專案介紹）"
echo "   - DEPLOYMENT_GUIDE.md（部署指南）"
echo ""
echo "🎯 準備好了嗎？讓我們開始推送代碼到 GitHub！"

# 詢問是否要自動推送
echo ""
read -p "是否要自動推送到 GitHub？(y/n): " PUSH_TO_GITHUB

if [ "$PUSH_TO_GITHUB" = "y" ] || [ "$PUSH_TO_GITHUB" = "Y" ]; then
    read -p "請輸入你的 GitHub 用戶名: " GITHUB_USERNAME
    read -p "請輸入倉庫名稱 (例如: football-league-system): " REPO_NAME
    
    echo "🚀 正在推送代碼到 GitHub..."
    
    # 添加所有文件
    git add .
    git commit -m "Initial commit: Football League Management System with authentication"
    
    # 添加遠程倉庫
    git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git 2>/dev/null || true
    
    # 推送到 GitHub
    git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || {
        echo "❌ 推送失敗，請手動推送或檢查 GitHub 倉庫設置"
        echo "手動推送命令："
        echo "git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        echo "git push -u origin main"
        exit 1
    }
    
    print_success "✅ 代碼已成功推送到 GitHub！"
    echo ""
    echo "🌐 現在請前往 Vercel："
    echo "1. 登入 https://vercel.com"
    echo "2. 點擊 'New Project'"
    echo "3. 選擇你的 GitHub 倉庫: $REPO_NAME"
    echo "4. 設定環境變量："
    echo "   NEXTAUTH_URL=https://$REPO_NAME.vercel.app"
    echo "   NEXTAUTH_SECRET=$(openssl rand -base64 32)"
    echo "5. 點擊 'Deploy'"
    echo ""
    echo "🎯 部署完成後，你的應用將在："
    echo "   https://$REPO_NAME.vercel.app"
else
    echo "ℹ️ 好的，請手動推送代碼到 GitHub"
    echo "完成後，在 Vercel 導入你的倉庫即可部署"
fi