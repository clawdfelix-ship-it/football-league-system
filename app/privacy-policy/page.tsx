'use client';

import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';

export const dynamic = 'force-dynamic';

type Section = { heading: { zh: string; en: string }; body: { zh: string; en: string }[] };

const SECTIONS: Section[] = [
  {
    heading: { zh: '1. 我們收集的資料', en: '1. Information We Collect' },
    body: [
      {
        zh: '在你使用香港銀行足球聯賽 2026（下稱「本平台」）期間，我們可能收集以下資料：帳戶資料（姓名、所屬球隊、電郵地址、登入密碼）、球隊與球員資料（球員姓名、號碼、位置、出賽及入球紀錄）、聯絡資料（隊長電郵），以及系統自動記錄的運作日誌（例如登入時間、IP 位址）。',
        en: 'While you use the Hong Kong Bank League 2026 platform (the "Platform"), we may collect: account information (name, team affiliation, email address, login password), team and player data (player names, squad numbers, positions, match appearances and goal records), contact information (captain emails), and system operation logs automatically recorded (such as login time and IP address).',
      },
    ],
  },
  {
    heading: { zh: '2. 資料的用途', en: '2. How We Use the Information' },
    body: [
      {
        zh: '收集所得資料僅用於營運聯賽，包括：管理球隊及球員帳戶、編排賽程及記錄賽果、計算積分榜、核實領隊身份、處理帳戶登入及安全，以及聯絡球隊代表。我們不會將你的個人資料用於未經相關的商業推廣。',
        en: 'The information collected is used solely to operate the league, including: managing team and player accounts, arranging fixtures and recording results, computing standings, verifying manager identity, handling account login and security, and contacting team representatives. We will not use your personal data for unrelated commercial marketing.',
      },
    ],
  },
  {
    heading: { zh: '3. 資料的披露與分享', en: '3. Disclosure and Sharing' },
    body: [
      {
        zh: '除下列情況外，我們不會向第三方出售或披露你的個人資料：(a) 已取得你的同意；(b) 聯賽營運所需的服務供應商（例如主機及數據儲存供應商），而該等供應商須遵守相若的保密責任；(c) 法律、法規或執法機構要求；或 (d) 為保障本平台、使用者或公眾的權利、財產或安全所必需。',
        en: 'We will not sell or disclose your personal data to third parties except: (a) with your consent; (b) to service providers necessary for league operations (such as hosting and data storage providers), who are bound by comparable confidentiality obligations; (c) as required by law, regulation, or law-enforcement authorities; or (d) where necessary to protect the rights, property, or safety of the Platform, its users, or the public.',
      },
      {
        zh: '球賽相關的公開資料（例如球員姓名、號碼、入球及球隊積分）會在本平台公開顯示，作為聯賽資訊的一部分；帳戶密碼及電郵等敏感資料則不會公開。',
        en: 'Public match-related information (such as player names, squad numbers, goals, and team standings) is displayed publicly on the Platform as part of league information; sensitive data such as account passwords and emails is not made public.',
      },
    ],
  },
  {
    heading: { zh: '4. 資料保安', en: '4. Data Security' },
    body: [
      {
        zh: '我們採取合理的技術及行政措施保護你的個人資料，包括傳輸加密（HTTPS）、密碼加密儲存、安全回應標頭，以及把管理功能限制於已授權帳戶。儘管如此，互聯網傳送並非絕對安全，請妥善保管你的登入密碼，切勿向他人透露。',
        en: 'We take reasonable technical and administrative measures to protect your personal data, including encrypted transmission (HTTPS), encrypted password storage, security response headers, and restricting administrative functions to authorised accounts. Nonetheless, no internet transmission is absolutely secure; please keep your login password safe and do not disclose it to others.',
      },
    ],
  },
  {
    heading: { zh: '5. 資料保留', en: '5. Data Retention' },
    body: [
      {
        zh: '我們只在營運聯賽及履行法律責任所需的期間內保留個人資料。聯賽結束或帳戶停用後，我們會按需要保留賽果紀錄作聯賽歷史存檔，並刪除或匿名化不再需要的個人識別資料。',
        en: 'We retain personal data only for as long as necessary to operate the league and fulfil legal obligations. After the league concludes or an account is deactivated, we may retain match-result records as league history archives, and delete or anonymise personal identifying data that is no longer needed.',
      },
    ],
  },
  {
    heading: { zh: '6. 你的權利', en: '6. Your Rights' },
    body: [
      {
        zh: '根據香港《個人資料（私隱）條例》（第 486 章），你有權查閱及要求更正我們持有關於你的個人資料。如需查閱、更正或刪除你的資料，請透過「隊長聯絡資料」頁面所列的官方聯絡方式與我們聯絡。',
        en: 'Under the Hong Kong Personal Data (Privacy) Ordinance (Cap. 486), you have the right to access and request correction of the personal data we hold about you. To access, correct, or delete your data, please contact us via the official channels listed on the "Captains Contacts" page.',
      },
    ],
  },
  {
    heading: { zh: '7. Cookie 及類似技術', en: '7. Cookies and Similar Technologies' },
    body: [
      {
        zh: '本平台使用必要的 Cookie 及工作階段技術以維持登入狀態及保障帳戶安全。這些技術對平台運作屬必要，不會用於跨網站追蹤。',
        en: 'The Platform uses essential cookies and session technologies to maintain login state and secure accounts. These are necessary for the Platform to function and are not used for cross-site tracking.',
      },
    ],
  },
  {
    heading: { zh: '8. 本政策的更新', en: '8. Updates to This Policy' },
    body: [
      {
        zh: '我們可能不時更新本私隱政策。更新後的版本會在本平台發布並即時生效，請定期查閱本頁面。',
        en: 'We may update this Privacy Policy from time to time. The updated version will be posted on the Platform and takes effect upon posting; please review this page periodically.',
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  const { t, language } = useLanguage();
  const isZh = language === 'zh';
  const updated = '2026-09-03';

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-10 pb-12 px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black italic mb-2 tracking-tight">
            {t('私隱政策', 'Privacy Policy')}
          </h2>
          <p className="text-blue-200 text-base font-light tracking-widest uppercase">
            {t('香港銀行足球聯賽 2026', 'Hong Kong Bank League 2026')}
          </p>
        </header>

        <main className="max-w-3xl mx-auto px-6 -mt-6 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-10">
            <p className="text-xs text-slate-400 mb-8">
              {t('最後更新：', 'Last updated: ')}
              {updated}
            </p>

            <p className="text-sm leading-relaxed text-slate-600 mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
              {isZh
                ? '本私隱政策說明 ZENEX-SPORTS LeagueCenter 如何收集、使用、披露及保障你在使用本平台時提供的個人資料。使用本平台即表示你同意本政策所述的處理方式。'
                : 'This Privacy Policy explains how ZENEX-SPORTS LeagueCenter collects, uses, discloses, and safeguards the personal data you provide when using the Platform. By using the Platform, you agree to the practices described in this policy.'}
            </p>

            <div className="space-y-8">
              {SECTIONS.map((s) => (
                <section key={s.heading.en}>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    {isZh ? s.heading.zh : s.heading.en}
                  </h3>
                  <div className="space-y-3">
                    {s.body.map((b, i) => (
                      <p key={i} className="text-sm leading-relaxed text-slate-600">
                        {isZh ? b.zh : b.en}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </HomeLayout>
  );
}
