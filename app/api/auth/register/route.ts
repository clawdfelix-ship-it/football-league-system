import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserPublic } from '@/lib/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!email || !username || !password) {
      return NextResponse.json({ message: '請填寫所有必填欄位' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: '電郵格式不正確' }, { status: 400 });
    }
    if (username.length < 2) {
      return NextResponse.json({ message: '使用者名稱至少 2 個字元' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: '密碼長度至少 6 個字元' }, { status: 400 });
    }
    const exists = getUserByEmail(email);
    if (exists) {
      return NextResponse.json({ message: '此電郵已被註冊' }, { status: 409 });
    }
    const user = await createUser({ email, username, password });
    return NextResponse.json({ user: getUserPublic(user) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: '註冊失敗' }, { status: 500 });
  }
}
