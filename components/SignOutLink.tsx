'use client';

import { signOut } from 'next-auth/react';

/** Compact inline sign-out link for the admin header (next to "Logged in as …"). */
export default function SignOutLink() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="underline underline-offset-2 text-slate-500 hover:text-red-600 transition-colors"
    >
      登出
    </button>
  );
}
