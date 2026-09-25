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
    <div className="min-h-screen bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('帳號採邀請制', 'Accounts Are Invite-Only')}</h1>
          <p className="text-blue-200">Hong Kong Bank League 2026</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-slate-700 mb-6">
            {t('本系統帳號由聯賽管理員統一開立，暫不開放自助註冊。如需帳號，請聯絡你嘅球隊負責人或聯賽管理員。', 'Accounts are created by the league administrator; self-service registration is not open. If you need an account, please contact your team representative or the league administrator.')}
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-[#1a237e] text-white py-3 px-4 rounded-xl hover:bg-[#283593] focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:ring-offset-2 focus:ring-offset-white transition duration-200 font-bold"
          >
            {t('返回登入', 'Back to login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
