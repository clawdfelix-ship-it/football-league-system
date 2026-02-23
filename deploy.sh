#!/bin/bash

# 一鍵 Vercel 部署腳本
# 簡化版本，適合快速部署

echo "🚀 足球聯賽管理系統 - 一鍵部署"
echo "=================================="

# 檢查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 正在安裝 Vercel CLI..."
    npm install -g vercel
fi

# 創建基礎配置
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
EOF

# 構建項目
echo "🔨 正在構建項目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 構建成功！"
    echo ""
    echo "🌐 開始 Vercel 部署..."
    echo "請在瀏覽器中完成授權（如果需要）"
    echo ""
    
    # 執行部署
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 部署成功！"
        echo ""
        echo "📋 系統資訊："
        echo "   ⚽ 足球聯賽管理系統"
        echo "   🔐 預設登入帳號："
        echo "      管理員: admin@football.com / password"
        echo "      用戶: user@football.com / password"
        echo ""
        echo "🔗 請在 Vercel 控制台中查看你的網址"
    else
        echo "❌ 部署失敗，請重試或手動部署"
    fi
else
    echo "❌ 構建失敗，請檢查錯誤"
fi