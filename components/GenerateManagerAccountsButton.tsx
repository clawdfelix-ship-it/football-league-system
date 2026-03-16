'use client';

import { useState } from 'react';

type CreatedAccount = { team: string; name: string; email: string; password: string };
type SkippedAccount = { team: string; name: string; email: string };

export default function GenerateManagerAccountsButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [created, setCreated] = useState<CreatedAccount[]>([]);
  const [skipped, setSkipped] = useState<SkippedAccount[]>([]);
  const [message, setMessage] = useState('');

  const run = async (regenerate: boolean) => {
    const confirmText = regenerate
      ? 'This will regenerate passwords for existing manager accounts. Continue?'
      : 'This will generate passwords for team manager accounts. Continue?';
    if (!confirm(confirmText)) return;

    setStatus('loading');
    setMessage('');
    setCreated([]);
    setSkipped([]);

    try {
      const res = await fetch('/api/admin/manager-accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ regenerate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');

      setCreated(data.created || []);
      setSkipped(data.skipped || []);
      setStatus('success');
      setMessage('Done. Copy passwords now (they are shown only once here).');
    } catch (e) {
      setStatus('error');
      setMessage((e as Error).message);
    }
  };

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => run(false)}
          className="text-xs text-amber-500 hover:text-amber-400 underline underline-offset-2"
        >
          Generate Manager Accounts
        </button>
        <button
          onClick={() => run(true)}
          className="text-[11px] text-zinc-400 hover:text-zinc-300 underline underline-offset-2"
        >
          Regenerate Passwords
        </button>
      </div>
    );
  }

  if (status === 'loading') {
    return <span className="text-xs text-zinc-500">Generating...</span>;
  }

  if (status === 'error') {
    return <span className="text-xs text-red-500">{message}</span>;
  }

  const lines = created.map((a) => `${a.team}\t${a.name}\t${a.email}\t${a.password}`).join('\n');

  return (
    <div className="text-right">
      <div className="text-xs text-green-500">{message}</div>
      {created.length > 0 && (
        <pre className="mt-2 max-w-[520px] whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-white p-3 text-[11px] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
          {lines}
        </pre>
      )}
      {created.length === 0 && (
        <div className="mt-2 text-xs text-zinc-500">No new accounts created.</div>
      )}
      {skipped.length > 0 && (
        <div className="mt-2 text-[11px] text-zinc-500">
          Skipped: {skipped.length}
        </div>
      )}
    </div>
  );
}

