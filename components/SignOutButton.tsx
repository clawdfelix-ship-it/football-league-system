'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="btn-admin-ghost btn-admin-sm text-red-600 hover:text-red-700"
    >
      Sign Out
    </button>
  );
}
