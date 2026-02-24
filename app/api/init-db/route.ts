import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/migrations';

export async function POST(request: NextRequest) {
  try {
    // 只有在開發環境或管理員請求時才允許初始化
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return NextResponse.json({ message: '未授權' }, { status: 401 });
      }
    }

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