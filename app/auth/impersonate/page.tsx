'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

/**
 * League-side impersonate landing page.
 *
 * A platform admin clicks "進入聯賽後台" in the platform console, which mints
 * a one-time token and redirects here:
 *   https://<slug>.zenex-sports.com/auth/impersonate?token=<hex>
 *
 * This page signs in via the credentials provider using the special
 * 'impersonate:<token>' password (handled in lib/auth.ts authorize step 0),
 * then redirects to /admin.
 */
export default function ImpersonatePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('缺少 token');
      return;
    }

    void (async () => {
      const res = await signIn('credentials', {
        redirect: false,
        // email is unused by the impersonate path but required by the provider schema
        email: 'impersonate@platform.local',
        password: `impersonate:${token}`,
      });

      if (res?.ok) {
        router.replace('/admin');
      } else {
        setError('Impersonate 失敗：token 無效、已用過或已過期。');
      }
    })();
  }, [params, router]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-slate-900">登入失敗</h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900">正在登入…</h1>
            <p className="mt-2 text-sm text-slate-600">以平台管理員身份進入聯賽後台</p>
          </>
        )}
      </div>
    </main>
  );
}
