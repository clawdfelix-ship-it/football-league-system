#!/bin/bash

echo "🔍 檢查 Vercel 部署狀態"
echo "=========================="
echo ""

# 獲取最新的提交資訊
LATEST_COMMIT=$(git rev-parse --short HEAD)
echo "📋 最新提交: $LATEST_COMMIT"
echo "📅 提交時間: $(git log -1 --format=%ci)"
echo "💬 提交訊息: $(git log -1 --format=%s)"
echo ""

# 檢查本地構建
echo "🔧 本地構建測試..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 本地構建成功！"
else
    echo "❌ 本地構建失敗"
fi

echo ""
echo "🌐 GitHub 倉庫: https://github.com/clawdfelix-ship-it/football-league-system"
echo "🚀 Vercel 專案: https://vercel.com/clawdfelix-ship-it/football-league-system"
echo ""
echo "⏱️  Vercel 應該會自動檢測到新的提交並開始部署"
echo "如果 2-3 分鐘後仍未部署，請手動在 Vercel 控制台觸發重新部署"
echo ""
echo "💡 提示: 您可以訪問 Vercel 控制台查看實時部署日誌"