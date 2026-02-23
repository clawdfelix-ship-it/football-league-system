// 由於使用 Mock Data，此檔案暫時不使用 Prisma
// 未來如果需要連接資料庫，可以在此處配置

export const prisma = null;

// 模擬資料庫連接函數
export const getDatabaseStatus = () => {
  return {
    connected: false,
    message: "使用 Mock Data 模式"
  };
};