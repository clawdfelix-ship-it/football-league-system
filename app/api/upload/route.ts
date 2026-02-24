import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ message: '未選擇文件' }, { status: 400 });
    }

    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: '只支援 JPG、PNG、GIF、WebP 圖片格式' }, { status: 400 });
    }

    // 驗證文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ message: '圖片大小不能超過 5MB' }, { status: 400 });
    }

    // 生成唯一檔名
    const ext = extname(file.name).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    
    // 轉換為 base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // 返回 base64 數據
    return NextResponse.json({ 
      url: `data:${file.type};base64,${base64}`,
      filename,
      size: file.size
    });
    
  } catch (error) {
    console.error('上傳錯誤:', error);
    return NextResponse.json({ message: '上傳失敗' }, { status: 500 });
  }
}