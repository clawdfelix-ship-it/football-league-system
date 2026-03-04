'use client';

import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';

export default function OverviewPage() {
  const { language } = useLanguage();
  const isZh = language === 'zh';

  return (
    <HomeLayout>
      <div className="min-h-screen bg-white text-slate-900 font-sans">
        <header className="bg-slate-900 text-white py-12 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black italic mb-4">Hong Kong Bank League 2026</h1>
          <p className="text-xl md:text-2xl text-blue-200 font-light tracking-wide uppercase">Partnered with ZENEX SPORTS</p>
          <p className="mt-2 text-lg text-gray-400">
            {isZh ? '香港銀行友誼足球聯賽 2026（ZENEX SPORTS 合作夥伴）' : 'Hong Kong Bank Friendly Football League 2026'}
          </p>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
          
          {/* Mission Statement */}
          <section className="text-center bg-blue-50 p-8 rounded-2xl border border-blue-100">
            {isZh ? (
              <h2 className="text-2xl font-bold text-blue-900 mb-2">以享受、友誼、聯繫和樂趣為主</h2>
            ) : (
              <p className="text-xl font-medium text-blue-700">Focus on Enjoyment, Friendship, Networking, and Fun</p>
            )}
          </section>

          {/* League Overview */}
          <section>
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-2">
              <div className="bg-blue-600 w-2 h-8"></div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isZh ? '賽事簡介' : 'League Overview'}
              </h2>
            </div>
            <ul className="space-y-6 text-lg">
              <li className="flex flex-col gap-1">
                <span className="font-bold">
                  {isZh ? '• 雙循環聯賽制' : '• Double round-robin'}
                </span>
                <span className="text-gray-600">
                  {isZh ? '每場 60 分鐘（上下半場各 30 分鐘，中場休息 10 分鐘）' : '60 minutes per match (two 30-min halves, 10-min halftime)'}
                </span>
              </li>

              <li className="flex flex-col gap-1">
                <span className="font-bold">
                  {isZh ? '• 8 隊參賽，8 ⼈制' : '• 8 teams, 8-a-side'}
                </span>
                <span className="text-gray-600">
                  {isZh ? '每隊最多 30 名球員' : 'Up to 30 registered players per team'}
                </span>
              </li>

              <li className="flex flex-col gap-1">
                <span className="font-bold">
                  {isZh ? '• 共 14 場⽐賽' : '• 14 matches in total'}
                </span>
                <span className="text-gray-600">
                  {isZh ? '主客場制' : 'Home & away format'}
                </span>
              </li>

              <li className="flex flex-col gap-1">
                <span className="font-bold">
                  {isZh ? '• 執法裁判' : '• Referees'}
                </span>
                <span className="text-gray-600">
                  {isZh ? '每場兩名裁判執法' : '2 referees per match'}
                </span>
              </li>
            </ul>
          </section>

          {/* Schedule & Venues */}
          <section>
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-2">
              <div className="bg-green-600 w-2 h-8"></div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isZh ? '賽程及場地' : 'Schedule & Venues'}
              </h2>
            </div>
            <ul className="space-y-6 text-lg">
              <li>
                <div className="font-bold">{isZh ? '• 賽季' : '• Season'}</div>
                <div className="text-gray-800 mt-1">
                  {isZh ? '3 ⽉底開始，預計 12 ⽉中結束（7-8 ⽉休賽）' : 'Matches start at the end of March and finish no later than mid-December (excluding July and August)'}
                </div>
              </li>
              
              <li>
                <div className="font-bold">{isZh ? '• 主客場安排' : '• Format'}</div>
                <div className="text-gray-800 mt-1">
                  {isZh ? '主場賽事：3 ⽉底⾄ 6 ⽉；客場賽事：9 ⽉⾄ 11 ⽉' : 'Home matches: End of March – June; Away matches: September – November 2026'}
                </div>
              </li>

              <li>
                <div className="font-bold">{isZh ? '• ⽐賽時間' : '• Time'}</div>
                <div className="text-gray-800 mt-1">
                  {isZh ? '逢星期⼆及星期三（公眾假期除外）, 晚上 8:00 或 9:30（視乎場地安排）' : 'Matches on Tuesdays and Wednesdays (excluding public holidays), 8:00pm or 9:30pm (subject to pitch availability)'}
                </div>
              </li>

              <li>
                <div className="font-bold">{isZh ? '• ⽐賽場地' : '• Venues'}</div>
                <div className="text-gray-800 mt-1">
                  {isZh ? '⾹港島⼈⼯草地球場:' : 'HK Island artificial grass pitches:'}
                </div>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-base text-gray-700">
                  <li>{isZh ? '中⼭紀念公園' : 'Sun Yat Sen Memorial Park'}</li>
                  <li>{isZh ? '跑⾺地遊樂場 8 號場' : 'Happy Valley Recreation Ground No. 8'}</li>
                  <li>{isZh ? '鰂⿂涌公園 1 號場' : 'Quarry Bay Park No. 1, near Taikoo Shing'}</li>
                  <li>{isZh ? '鰂⿂涌公園 2 號場' : 'Quarry Bay Park No. 2, near Quarry Bay Station'}</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Match Rules */}
          <section>
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-2">
              <div className="bg-orange-600 w-2 h-8"></div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isZh ? '⽐賽規則' : 'Match Rules'}
              </h2>
            </div>
            <ul className="space-y-6 text-lg">
              <li>
                <div className="font-bold">{isZh ? '• 球員註冊與出場' : '• Registration'}</div>
                <div className="text-gray-800 mt-1">
                  {isZh ? '每隊球隊可註冊球員為 30 人，而每場比賽可出場球員為 16 名' : 'Each team may register up to 30 players, with a maximum of 16 players eligible to participate in each match.'}
                </div>
              </li>
              
              <li>
                <div className="font-bold">{isZh ? '• 越位與換人' : '• Offside & Subs'}</div>
                <div className="text-gray-800 mt-1">
                  {isZh ? '不設越位，換⼈無限制' : 'No offside, unlimited substitutions'}
                </div>
              </li>

              <li>
                <div className="font-bold">{isZh ? '• 裝備' : '• Equipment'}</div>
                <div className="text-gray-800 mt-1">
                  {isZh ? '球員需穿著適合⽐賽的裝備及統⼀球⾐，所有球員必須佩戴護脛' : 'Players must wear proper gear and matching jerseys; all players must wear shin pads'}
                </div>
              </li>

              <li>
                <div className="font-bold">{isZh ? '• 球衣' : '• Jerseys'}</div>
                <div className="text-gray-800 mt-1">
                  {isZh ? '每隊球隊須準備主場及作客波衫各⼀套' : 'All teams are required to provide one set of home jerseys and one set of away jerseys'}
                </div>
              </li>
            </ul>
          </section>

          {/* Forfeits & Postponement */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-gray-300 pb-2">
                {isZh ? '棄權及缺席' : 'Forfeits & Non-Appearance'}
              </h3>
              <ul className="space-y-4">
                <li>
                  <div className="font-bold text-red-600">{isZh ? '• 遲到棄權' : '• Late Start'}</div>
                  <div className="text-sm">
                    {isZh ? '開賽後 10 分鐘未能開始⽐賽，視作棄權' : 'Failure to start within 10 minutes after scheduled kick-off = forfeit'}
                  </div>
                </li>
                <li>
                  <div className="font-bold text-red-600">{isZh ? '• 人數不足' : '• Insufficient Players'}</div>
                  <div className="text-sm">
                    {isZh ? '球隊⼈數少於 6 ⼈，視作棄權' : 'Fewer than 6 players = forfeit'}
                  </div>
                </li>
                <li>
                  <div className="font-bold text-red-600">{isZh ? '• 判罰' : '• Penalty'}</div>
                  <div className="text-sm">
                    {isZh ? '棄權⽅將被判負 0-3' : 'Forfeiting team loses 0-3'}
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-gray-300 pb-2">
                {isZh ? '延期⽐賽' : 'Postponement'}
              </h3>
              <div className="space-y-2">
                <p className="font-bold text-gray-800">{isZh ? '提前通知' : 'Advance Notice'}</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {isZh 
                    ? '球隊應該在不少於 30 ⽇前聯絡會⽅有關申請休假事宜，該賽周將不會安排任何⽐賽。' 
                    : 'Teams are requested to advise the fixtures officer as early as possible (and at least 30 days before the event) if a special event that involves a majority of the team is planned (e.g., company dinner, weddings), the team will not be required to play a fixture on that week.'}
                </p>
              </div>
            </div>
          </section>

          {/* Discipline */}
          <section className="bg-red-50 p-8 rounded-2xl border border-red-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-600 w-2 h-8"></div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isZh ? '紀律與友誼' : 'Discipline & Sportsmanship'}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="font-bold text-lg text-red-800">{isZh ? '以友誼為重' : 'Sportsmanship First'}</div>
                  <div className="text-gray-700">
                    {isZh ? '嚴禁粗暴或攻擊⾏為' : 'No aggressive or unsporting behavior'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg text-red-800">{isZh ? '隊長責任' : 'Captain\'s Responsibility'}</div>
                  <div className="text-gray-700">
                    {isZh ? '球隊隊⻑/經理需協助維持球員良好⾏為' : 'Team captain/manager helps ensure good conduct'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg text-red-800">{isZh ? '裁判權威' : 'Referee\'s Authority'}</div>
                  <div className="text-gray-700">
                    {isZh ? '裁判擁有最終決定權，請尊重判決' : 'Referee’s decisions are final; please respect all calls'}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-yellow-500">
                  <div className="font-bold text-yellow-900">{isZh ? '兩黃一紅' : 'Two Yellow Cards'}</div>
                  <div className="text-sm text-yellow-800">
                    {isZh ? '在一場比賽中累積兩張黃牌或領取一張紅牌的球員，必須立即離場' : 'A player receiving two yellow cards in a single match, or a straight red card, must leave the pitch immediately'}
                  </div>
                </div>
                <div className="bg-red-100 p-4 rounded-lg border-l-4 border-red-600">
                  <div className="font-bold text-red-900">{isZh ? '紅牌停賽' : 'Red Card Suspension'}</div>
                  <div className="text-sm text-red-800">
                    {isZh ? '紅牌球員需即時離場，並⾃動停賽⼀場' : 'Red card: player leaves immediately, suspended for next match'}
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </HomeLayout>
  );
}
