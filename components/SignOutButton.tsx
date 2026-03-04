'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-xs text-red-500 hover:text-red-700 font-medium underline underline-offset-2"
    >
      Sign Out
    </button>
  );
}
