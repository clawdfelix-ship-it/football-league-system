import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { RegisterSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { createUser, getUserByEmail } from '@/lib/users-new';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`register:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
    if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

    let input: { email: string; username: string; password: string };
    try {
      input = RegisterSchema.parse(await request.json());
    } catch (e) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
    }
    const email = input.email.toLowerCase();
    const username = input.username;
    const password = input.password;
    
    const exists = await getUserByEmail(email);
    if (exists) {
      return fail(409, 'EMAIL_TAKEN', '此電郵已被註冊');
    }
    
    const user = await createUser({ email, username, password });
    
    // 返回不包含敏感信息的用戶數據
    return ok(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
    
  } catch (error) {
    const message = error instanceof Error ? error.message : '註冊失敗';
    return fail(500, 'INTERNAL_ERROR', message);
  }
}
