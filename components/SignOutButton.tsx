'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="btn-admin-danger w-full sm:w-auto"
    >
      Sign Out
    </button>
  );
}
