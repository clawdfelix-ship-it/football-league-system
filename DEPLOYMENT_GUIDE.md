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
