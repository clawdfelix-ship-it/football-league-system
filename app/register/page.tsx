'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

// League accounts are invite-only (provisioned by an admin). Public self
// signup is disabled — the API rejects registrations unless
// ALLOW_PUBLIC_REGISTER=true. This page explains that instead of showing a
// signup form.
export default function RegisterPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex items-center justify-center px-4 py-12">
      <div className="auth-container">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('帳號採邀請制', 'Accounts Are Invite-Only')}</h1>
          <p className="text-blue-200">Hong Kong Bank League 2026</p>
        </div>
        <div className="card p-8 text-center shadow-2xl">
          <p className="text-slate-700 mb-6">
            {t('本系統帳號由聯賽管理員統一開立，暫不開放自助註冊。如需帳號，請聯絡你嘅球隊負責人或聯賽管理員。', 'Accounts are created by the league administrator; self-service registration is not open. If you need an account, please contact your team representative or the league administrator.')}
          </p>
          <Link
            href="/login"
            className="btn-primary w-full h-11 rounded-xl font-bold"
          >
            {t('返回登入', 'Back to login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
