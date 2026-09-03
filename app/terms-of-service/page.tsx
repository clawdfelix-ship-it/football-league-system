'use client';

import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';

export const dynamic = 'force-dynamic';

type Section = { heading: { zh: string; en: string }; body: { zh: string; en: string }[] };

const SECTIONS: Section[] = [
  {
    heading: { zh: '1. 接受條款', en: '1. Acceptance of Terms' },
    body: [
      {
        zh: '本平台由 ZENEX-SPORTS LeagueCenter 營運，為香港銀行足球聯賽 2026 提供賽程、積分、球隊及球員資訊。你存取或使用本平台，即表示你已閱讀、明白並同意受本服務條款約束。如你不同意，請停止使用本平台。',
        en: 'The Platform is operated by ZENEX-SPORTS LeagueCenter and provides fixtures, standings, team and player information for the Hong Kong Bank League 2026. By accessing or using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please stop using the Platform.',
      },
    ],
  },
  {
    heading: { zh: '2. 帳戶與註冊', en: '2. Accounts and Registration' },
    body: [
      {
        zh: '部分功能（例如球隊管理、錄入賽果）需要帳戶。帳戶由聯賽管理員開立及授權，註冊名額僅限參賽球隊的領隊及代表。你須提供準確資料，並妥善保管帳戶密碼；你須對帳戶下的所有活動負責。如發現未經授權使用，應立即通知管理員。',
        en: 'Some features (such as team management and entering results) require an account. Accounts are created and authorised by league administrators, and registration is limited to managers and representatives of participating teams. You must provide accurate information and keep your account password secure; you are responsible for all activity under your account. If you discover unauthorised use, notify an administrator immediately.',
      },
      {
        zh: '首次登入後你須設定自己的密碼，密碼長度須至少 8 位。',
        en: 'You must set your own password after first login; the password must be at least 8 characters long.',
      },
    ],
  },
  {
    heading: { zh: '3. 可接受使用', en: '3. Acceptable Use' },
    body: [
      {
        zh: '你同意不會：(a) 未經授權存取或試圖存取管理功能或他人帳戶；(b) 干擾或破壞平台運作、繞過安全措施；(c) 上載虛假、誤導或不當內容；(d) 移除或竄改他人資料；(e) 利用平台進行任何違法或騷擾行為；或 (f) 以自動化方式大量抓取平台資料。',
        en: 'You agree not to: (a) access or attempt to access administrative functions or other users’ accounts without authorisation; (b) interfere with or disrupt the Platform or bypass security measures; (c) upload false, misleading, or inappropriate content; (d) remove or tamper with others’ data; (e) use the Platform for any unlawful or harassing conduct; or (f) scrape Platform data in bulk by automated means.',
      },
    ],
  },
  {
    heading: { zh: '4. 資料的準確性', en: '4. Accuracy of Data' },
    body: [
      {
        zh: '賽程、賽果、積分及球員資料由管理員及獲授權領隊錄入。我們會盡力確保資料準確，但不作絕對保證。如發現資料有誤，請透過官方聯絡方式通知我們，我們會盡快更正。',
        en: 'Fixtures, results, standings, and player data are entered by administrators and authorised managers. We endeavour to keep data accurate but do not guarantee absolute accuracy. If you find any errors, please notify us via the official contact channels and we will correct them as soon as possible.',
      },
    ],
  },
  {
    heading: { zh: '5. 知識產權', en: '5. Intellectual Property' },
    body: [
      {
        zh: '本平台的內容（包括 ZENEX 品牌標誌、文字、版面及聯賽資料）版權及相關權利歸 ZENEX-SPORTS LeagueCenter 或相關權利人所有。未經書面許可，不得複製、改編或公開分發有關內容。個別球隊及球員名稱的權利歸各自擁有人。',
        en: 'The content on the Platform (including the ZENEX brand logo, text, layout, and league data) is owned by ZENEX-SPORTS LeagueCenter or the relevant rights holders. You may not reproduce, adapt, or publicly distribute such content without written permission. Team and player names belong to their respective owners.',
      },
    ],
  },
  {
    heading: { zh: '6. 免責聲明', en: '6. Disclaimer' },
    body: [
      {
        zh: '本平台按「現狀」提供，我們不保證平台不會中斷、無錯誤或絕對安全。在法律容許的最大範圍內，我們對因使用或無法使用本平台而引致的任何直接或間接損失概不負責。',
        en: 'The Platform is provided on an "as is" basis. We do not warrant that it will be uninterrupted, error-free, or absolutely secure. To the maximum extent permitted by law, we are not liable for any direct or indirect loss arising from the use of, or inability to use, the Platform.',
      },
    ],
  },
  {
    heading: { zh: '7. 條款修改', en: '7. Changes to Terms' },
    body: [
      {
        zh: '我們保留不時修訂本服務條款的權利。修訂後的條款會在本平台發布並即時生效；繼續使用本平台即表示接受修訂後的條款。',
        en: 'We reserve the right to revise these Terms of Service from time to time. Revised terms take effect upon posting; continued use of the Platform constitutes acceptance of the revised terms.',
      },
    ],
  },
  {
    heading: { zh: '8. 適用法律及聯絡', en: '8. Governing Law and Contact' },
    body: [
      {
        zh: '本條款受香港特別行政區法律管轄。如有任何查詢，請透過「隊長聯絡資料」頁面所列的官方聯絡方式與我們聯絡。',
        en: 'These terms are governed by the laws of the Hong Kong Special Administrative Region. For any enquiries, please contact us via the official channels listed on the "Captains Contacts" page.',
      },
    ],
  },
];

export default function TermsOfServicePage() {
  const { t, language } = useLanguage();
  const isZh = language === 'zh';
  const updated = '2026-09-03';

  return (
    <HomeLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-10 pb-12 px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black italic mb-2 tracking-tight">
            {t('服務條款', 'Terms of Service')}
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
                ? '歡迎使用 ZENEX-SPORTS LeagueCenter。請在使用本平台前細閱本服務條款。'
                : 'Welcome to ZENEX-SPORTS LeagueCenter. Please read these Terms of Service carefully before using the Platform.'}
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
