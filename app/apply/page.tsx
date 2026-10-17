'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

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
  const { t } = useLanguage();
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
        throw new Error(body?.error?.message || t('提交失敗，請稍後再試。', 'Submission failed. Please try again later.'));
      }
      setStatus('done');
      setForm(EMPTY);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('提交失敗，請稍後再試。', 'Submission failed. Please try again later.'));
    }
  }

  return (
    <div className="min-h-screen bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-6 flex justify-end">
          <LanguageToggle />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('開辦你的聯賽', 'Start your league')}
          </h1>
          <p className="text-blue-200 text-sm">
            {t('ZENEX SPORTS · 聯賽申請', 'ZENEX SPORTS · League Application')}
          </p>
        </div>

        {status === 'done' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-4xl mb-4" aria-hidden="true">✅</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t('已收到申請', 'Application received')}
            </h2>
            <p className="text-slate-600 text-sm mb-6">
              {t(
                '我們會盡快審閱並以電郵聯絡你。多謝！',
                'We will review your application and contact you by email shortly. Thank you!'
              )}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-[#1a237e] font-semibold text-sm hover:underline"
            >
              {t('提交另一個申請', 'Submit another application')}
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="bg-white rounded-2xl shadow-2xl p-8 space-y-4"
          >
            <Field label={t('聯賽名稱 *', 'League name *')}>
              <input
                required
                minLength={2}
                value={form.leagueName}
                onChange={set('leagueName')}
                placeholder={t('例如：Summer Cup 2026', 'e.g. Summer Cup 2026')}
                className={inputCls}
              />
            </Field>
            <Field label={t('聯賽網址代稱（可留空）', 'Subdomain slug (optional)')}>
              <input
                value={form.requestedSlug}
                onChange={set('requestedSlug')}
                placeholder="summer-cup"
                pattern="[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?"
                title={t(
                  '只限英文小寫、數字、連字符，開頭及結尾須為英文或數字',
                  'Lowercase letters, numbers and hyphens only; must start and end with a letter or number'
                )}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('聯絡人 *', 'Contact name *')}>
                <input
                  required
                  value={form.contactName}
                  onChange={set('contactName')}
                  className={inputCls}
                />
              </Field>
              <Field label={t('預計隊數', 'Estimated teams')}>
                <input
                  type="number"
                  min={0}
                  value={form.teamCountEst}
                  onChange={set('teamCountEst')}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label={t('聯絡電郵 *', 'Contact email *')}>
              <input
                required
                type="email"
                value={form.contactEmail}
                onChange={set('contactEmail')}
                className={inputCls}
              />
            </Field>
            <Field label={t('聯絡電話（可留空）', 'Contact phone (optional)')}>
              <input
                value={form.contactPhone}
                onChange={set('contactPhone')}
                className={inputCls}
              />
            </Field>
            <Field label={t('備註（可留空）', 'Notes (optional)')}>
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
              {status === 'submitting'
                ? t('提交中…', 'Submitting…')
                : t('遞交申請', 'Submit application')}
            </button>

            <p className="text-center">
              <Link href="/" className="text-xs text-slate-500 hover:underline">
                {t('返回主頁', 'Back to home')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a237e] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_#fff_inset]';

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
