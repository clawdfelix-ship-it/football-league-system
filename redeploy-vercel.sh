#!/bin/bash

echo "🚀 重新部署足球聯賽系統到 Vercel"
echo "=================================="
echo ""

# 檢查是否已登入 Vercel
echo "🔍 檢查 Vercel 登入狀態..."
vercel whoami

if [ $? -ne 0 ]; then
    echo "❌ 您需要先登入 Vercel"
    echo "請執行: vercel login"
    exit 1
fi

echo "✅ 已登入 Vercel"
echo ""

# 創建新的 Vercel 專案
echo "🏗️  創建新的 Vercel 專案..."
cd /Users/sallychan/Desktop/AI_ZENEX_CUP/web

# 使用 Vercel CLI 部署
echo "📦 開始部署..."
vercel --prod --yes

echo ""
echo "✅ 部署完成！"
echo ""
echo "🌐 您的足球聯賽系統應該已經上線！"
echo "如果這是第一次部署，Vercel 會提供一個新的網址"
echo ""
echo "💡 登入資訊："
echo "   - 管理員: admin@football.com / password"
echo "   - 用戶: user@football.com / password"