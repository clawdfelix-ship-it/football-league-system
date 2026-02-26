import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/migrations';

export async function POST(request: NextRequest) {
  try {
    // 允許 init-db 在 production 也可以使用 (無需認證)
    // 如果需要認證，可以使用 ADMIN_SECRET 環境變量
    
    await initializeDatabase();
    return NextResponse.json({ message: '數據庫初始化成功' });
  } catch (error) {
    console.error('數據庫初始化失敗:', error);
    return NextResponse.json(
      { message: '數據庫初始化失敗', error: (error as Error).message },
      { status: 500 }
    );
  }
}