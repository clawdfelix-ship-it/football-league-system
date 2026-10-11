'use client';

import { useState } from 'react';
import Link from 'next/link';

type Status = 'idle' | 'submitting' | 'done' | 'error';

const EMPTY = {
  leagueName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  teamCountEst: '',
  notes: '',
  requestedSlug: '',
};

export default function ApplyPage() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const set = (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/league-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueName: form.leagueName,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || undefined,
          teamCountEst: form.teamCountEst ? Number(form.teamCountEst) : undefined,
          notes: form.notes || undefined,
          requestedSlug: form.requestedSlug || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || body?.ok === false) {
        throw new Error(body?.error?.message || 'Submission failed');
      }
      setStatus('done');
      setForm(EMPTY);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Submission failed');
    }
  }

  return (
    <div className="min-h-screen bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">開辦你的聯賽</h1>
          <p className="text-blue-200 text-sm">
            ZENEX SPORTS · League Application
          </p>
        </div>

        {status === 'done' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">已收到申請</h2>
            <p className="text-slate-600 text-sm mb-6">
              我們會盡快審閱並以電郵聯絡你。多謝！
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-[#1a237e] font-semibold text-sm hover:underline"
            >
              提交另一個申請
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="bg-white rounded-2xl shadow-2xl p-8 space-y-4"
          >
            <Field label="聯賽名稱 *">
              <input
                required
                minLength={2}
                value={form.leagueName}
                onChange={set('leagueName')}
                placeholder="例如：Summer Cup 2026"
                className={inputCls}
              />
            </Field>
            <Field label="聯賽網址代稱（可留空）">
              <input
                value={form.requestedSlug}
                onChange={set('requestedSlug')}
                placeholder="summer-cup（只限英文、數字、連字符）"
                pattern="[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="聯絡人 *">
                <input
                  required
                  value={form.contactName}
                  onChange={set('contactName')}
                  className={inputCls}
                />
              </Field>
              <Field label="預計隊數">
                <input
                  type="number"
                  min={0}
                  value={form.teamCountEst}
                  onChange={set('teamCountEst')}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="聯絡電郵 *">
              <input
                required
                type="email"
                value={form.contactEmail}
                onChange={set('contactEmail')}
                className={inputCls}
              />
            </Field>
            <Field label="聯絡電話（可留空）">
              <input
                value={form.contactPhone}
                onChange={set('contactPhone')}
                className={inputCls}
              />
            </Field>
            <Field label="備註（可留空）">
              <textarea
                rows={3}
                value={form.notes}
                onChange={set('notes')}
                maxLength={4000}
                className={inputCls}
              />
            </Field>

            {status === 'error' && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-[#1a237e] text-white py-3 rounded-xl font-bold hover:bg-[#283593] disabled:opacity-60 transition"
            >
              {status === 'submitting' ? '提交中…' : '遞交申請'}
            </button>

            <p className="text-center">
              <Link href="/" className="text-xs text-slate-500 hover:underline">
                返回主頁
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
