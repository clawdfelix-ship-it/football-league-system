# 🚀 足球聯賽系統 - Vercel 部署指南

## ✅ 當前狀態

- **本地構建**: ✅ 成功
- **代碼推送**: ✅ 已推送到 GitHub
- **GitHub 倉庫**: https://github.com/clawdfelix-ship-it/football-league-system

## 🔧 手動部署步驟

由於 Vercel CLI 有權限問題，請按照以下步驟手動部署：

### 步驟 1: 訪問 Vercel 網站
1. 打開瀏覽器訪問 https://vercel.com
2. 使用您的帳號登入

### 步驟 2: 導入 GitHub 專案
1. 點擊 "New Project"
2. 選擇 "Import Git Repository"
3. 搜索並選擇: `clawdfelix-ship-it/football-league-system`
4. 點擊 "Import"

### 步驟 3: 配置專案
1. **專案名稱**: 保持 `football-league-system` 或自訂
2. **框架**: Next.js (自動偵測)
3. **根目錄**: `./`
4. **構建命令**: `npm run build`
5. **輸出目錄**: `.next`

### 步驟 4: 環境變數
添加以下環境變數：
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

### 步驟 5: 部署
點擊 "Deploy" 開始部署

## 📋 系統資訊

### 🌐 應用程式功能
- **主頁**: 顯示聯賽積分榜和最近比賽
- **管理員頁面**: 添加比賽結果（需要登入）
- **登入系統**: 支援角色權限管理
- **Mock 數據**: 無需資料庫即可運行

### 🔑 測試帳號
- **管理員**: `admin@football.com` / `password`
- **用戶**: `user@football.com` / `password`

### 🎯 預期網址
部署成功後，您的應用程式將在以下網址運行：
`https://football-league-system.vercel.app`

## 🆘 常見問題

### 如果部署失敗：
1. 檢查構建日誌中的錯誤訊息
2. 確保所有依賴項已正確安裝
3. 檢查環境變數是否設置正確

### 如果網站顯示不同內容：
這可能表示 Vercel 部署了錯誤的專案或分支。請確保：
1. 選擇了正確的 GitHub 倉庫
2. 部署的是 `main` 分支
3. 專案根目錄設置正確

## 📞 支援

如果遇到問題，請提供：
1. 具體的錯誤訊息
2. 部署日誌截圖
3. 您嘗試的步驟

---
**最後更新**: $(date)
**狀態**: 等待手動 Vercel 部署