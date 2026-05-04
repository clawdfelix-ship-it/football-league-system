import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { ok, fail } from '@/lib/api/response';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { getAuthContext } from '@/lib/authz';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    }

    const ip = getClientIp(request);
    const actor = auth.email ?? auth.username ?? 'unknown';
    const rl = rateLimit(`upload:${ip}:${actor}`, { limit: 30, windowMs: 10 * 60 * 1000 });
    if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return fail(400, 'VALIDATION_ERROR', '未選擇文件');
    }

    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return fail(400, 'VALIDATION_ERROR', '只支援 JPG、PNG、GIF、WebP 圖片格式');
    }

    // 驗證文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return fail(400, 'VALIDATION_ERROR', '圖片大小不能超過 5MB');
    }

    // 生成唯一檔名
    const ext = extname(file.name).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    
    // 轉換為 base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // 返回 base64 數據
    return ok({ 
      url: `data:${file.type};base64,${base64}`,
      filename,
      size: file.size
    });
    
  } catch {
    return fail(500, 'INTERNAL_ERROR', '上傳失敗');
  }
}
