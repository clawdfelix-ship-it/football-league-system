import Link from 'next/link';

// League accounts are invite-only (provisioned by an admin). Public self
// signup is disabled — the API rejects registrations unless
// ALLOW_PUBLIC_REGISTER=true. This page explains that instead of showing a
// signup form.
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-cyan-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">帳號採邀請制</h1>
          <p className="text-gray-300">Hong Kong Bank League 2026</p>
        </div>
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <p className="text-gray-700 mb-6">
            本系統帳號由聯賽管理員統一開立，暫不開放自助註冊。
            如需帳號，請聯絡你嘅球隊負責人或聯賽管理員。
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200"
          >
            返回登入
          </Link>
        </div>
      </div>
    </div>
  );
}
