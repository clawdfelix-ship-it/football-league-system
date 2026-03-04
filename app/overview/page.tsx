'use client';

import HomeLayout from '@/components/HomeLayout';
import { useLanguage } from '@/context/LanguageContext';

export default function OverviewPage() {
  const { t } = useLanguage();

  return (
    <HomeLayout>
      <div className="min-h-screen bg-white text-slate-900 font-sans">
        <header className="bg-slate-900 text-white py-12 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black italic mb-4">Hong Kong Bank League 2026</h1>
          <p className="text-xl md:text-2xl text-blue-200 font-light tracking-wide uppercase">Partnered with ZENEX SPORTS</p>
          <p className="mt-2 text-lg text-gray-400">香港銀行友誼足球聯賽 2026（ZENEX SPORTS 合作夥伴）</p>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
          
          {/* Mission Statement */}
          <section className="text-center bg-blue-50 p-8 rounded-2xl border border-blue-100">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">以享受、友誼、聯繫和樂趣為主</h2>
            <p className="text-xl font-medium text-blue-700">Focus on Enjoyment, Friendship, Networking, and Fun</p>
          </section>

          {/* League Overview */}
          <section>
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-2">
              <div className="bg-blue-600 w-2 h-8"></div>
              <h2 className="text-2xl font-bold text-slate-900">賽事簡介 / League Overview</h2>
            </div>
            <ul className="space-y-6 text-lg">
              <li className="flex flex-col md:flex-row md:items-baseline gap-2">
                <span className="font-bold min-w-[200px]">• 雙循環聯賽制</span>
                <span className="text-gray-600">每場 60 分鐘（上下半場各 30 分鐘，中場休息 10 分鐘）</span>
              </li>
              <li className="pl-4 md:pl-[208px] text-gray-500 italic text-sm -mt-4">
                Double round-robin, 60 minutes per match (two 30-min halves, 10-min halftime)
              </li>

              <li className="flex flex-col md:flex-row md:items-baseline gap-2">
                <span className="font-bold min-w-[200px]">• 8 隊參賽，8 ⼈制</span>
                <span className="text-gray-600">每隊最多 30 名球員</span>
              </li>
              <li className="pl-4 md:pl-[208px] text-gray-500 italic text-sm -mt-4">
                8 teams, 8-a-side, up to 30 registered players per team
              </li>

              <li className="flex flex-col md:flex-row md:items-baseline gap-2">
                <span className="font-bold min-w-[200px]">• 共 14 場⽐賽</span>
                <span className="text-gray-600">主客場制</span>
              </li>
              <li className="pl-4 md:pl-[208px] text-gray-500 italic text-sm -mt-4">
                14 matches in total, home & away format
              </li>

              <li className="flex flex-col md:flex-row md:items-baseline gap-2">
                <span className="font-bold min-w-[200px]">• 執法裁判</span>
                <span className="text-gray-600">每場兩名裁判執法</span>
              </li>
              <li className="pl-4 md:pl-[208px] text-gray-500 italic text-sm -mt-4">
                2 referees per match
              </li>
            </ul>
          </section>

          {/* Schedule & Venues */}
          <section>
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-2">
              <div className="bg-green-600 w-2 h-8"></div>
              <h2 className="text-2xl font-bold text-slate-900">賽程及場地 / Schedule & Venues</h2>
            </div>
            <ul className="space-y-6 text-lg">
              <li>
                <div className="font-bold">• 賽季 (Season)</div>
                <div className="text-gray-800 mt-1">3 ⽉底開始，預計 12 ⽉中結束（7-8 ⽉休賽）</div>
                <div className="text-gray-500 italic text-sm">Matches start at the end of March and finish no later than mid-December (excluding July and August)</div>
              </li>
              
              <li>
                <div className="font-bold">• 主客場安排 (Format)</div>
                <div className="text-gray-800 mt-1">主場賽事：3 ⽉底⾄ 6 ⽉；客場賽事：9 ⽉⾄ 11 ⽉</div>
                <div className="text-gray-500 italic text-sm">Home matches: End of March – June; Away matches: September – November 2026</div>
              </li>

              <li>
                <div className="font-bold">• ⽐賽時間 (Time)</div>
                <div className="text-gray-800 mt-1">逢星期⼆及星期三（公眾假期除外）, 晚上 8:00 或 9:30（視乎場地安排）</div>
                <div className="text-gray-500 italic text-sm">Matches on Tuesdays and Wednesdays (excluding public holidays), 8:00pm or 9:30pm (subject to pitch availability)</div>
              </li>

              <li>
                <div className="font-bold">• ⽐賽場地 (Venues)</div>
                <div className="text-gray-800 mt-1">⾹港島⼈⼯草地球場 / HK Island artificial grass pitches:</div>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-base text-gray-700">
                  <li>中⼭紀念公園 (Sun Yat Sen Memorial Park)</li>
                  <li>跑⾺地遊樂場 8 號場 (Happy Valley Recreation Ground No. 8)</li>
                  <li>鰂⿂涌公園 1 號場 (Quarry Bay Park No. 1, near Taikoo Shing)</li>
                  <li>鰂⿂涌公園 2 號場 (Quarry Bay Park No. 2, near Quarry Bay Station)</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Match Rules */}
          <section>
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-2">
              <div className="bg-orange-600 w-2 h-8"></div>
              <h2 className="text-2xl font-bold text-slate-900">⽐賽規則 / Match Rules</h2>
            </div>
            <ul className="space-y-6 text-lg">
              <li>
                <div className="font-bold">• 球員註冊與出場 (Registration)</div>
                <div className="text-gray-800 mt-1">每隊球隊可註冊球員為 30 人，而每場比賽可出場球員為 16 名</div>
                <div className="text-gray-500 italic text-sm">Each team may register up to 30 players, with a maximum of 16 players eligible to participate in each match.</div>
              </li>
              
              <li>
                <div className="font-bold">• 越位與換人 (Offside & Subs)</div>
                <div className="text-gray-800 mt-1">不設越位，換⼈無限制</div>
                <div className="text-gray-500 italic text-sm">No offside, unlimited substitutions</div>
              </li>

              <li>
                <div className="font-bold">• 裝備 (Equipment)</div>
                <div className="text-gray-800 mt-1">球員需穿著適合⽐賽的裝備及統⼀球⾐，所有球員必須佩戴護脛</div>
                <div className="text-gray-500 italic text-sm">Players must wear proper gear and matching jerseys; all players must wear shin pads</div>
              </li>

              <li>
                <div className="font-bold">• 球衣 (Jerseys)</div>
                <div className="text-gray-800 mt-1">每隊球隊須準備主場及作客波衫各⼀套</div>
                <div className="text-gray-500 italic text-sm">All teams are required to provide one set of home jerseys and one set of away jerseys</div>
              </li>
            </ul>
          </section>

          {/* Forfeits & Postponement */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-gray-300 pb-2">棄權及缺席 / Forfeits</h3>
              <ul className="space-y-4">
                <li>
                  <div className="font-bold text-red-600">• 遲到棄權</div>
                  <div className="text-sm">開賽後 10 分鐘未能開始⽐賽，視作棄權</div>
                  <div className="text-xs text-gray-500 italic">Failure to start within 10 mins = forfeit</div>
                </li>
                <li>
                  <div className="font-bold text-red-600">• 人數不足</div>
                  <div className="text-sm">球隊⼈數少於 6 ⼈，視作棄權</div>
                  <div className="text-xs text-gray-500 italic">Fewer than 6 players = forfeit</div>
                </li>
                <li>
                  <div className="font-bold text-red-600">• 判罰</div>
                  <div className="text-sm">棄權⽅將被判負 0-3</div>
                  <div className="text-xs text-gray-500 italic">Forfeiting team loses 0-3</div>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-gray-300 pb-2">延期⽐賽 / Postponement</h3>
              <div className="space-y-2">
                <p className="font-bold text-gray-800">提前通知 (Advance Notice)</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  球隊應該在不少於 30 ⽇前聯絡會⽅有關申請休假事宜，該賽周將不會安排任何⽐賽。
                </p>
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  Teams are requested to advise the fixtures officer as early as possible (and at least 30 days before the event) if a special event that involves a majority of the team is planned (e.g., company dinner, weddings), the team will not be required to play a fixture on that week.
                </p>
              </div>
            </div>
          </section>

          {/* Discipline */}
          <section className="bg-red-50 p-8 rounded-2xl border border-red-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-600 w-2 h-8"></div>
              <h2 className="text-2xl font-bold text-slate-900">紀律與友誼 / Discipline & Sportsmanship</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="font-bold text-lg text-red-800">以友誼為重</div>
                  <div className="text-gray-700">嚴禁粗暴或攻擊⾏為</div>
                  <div className="text-xs text-gray-500 italic">Sportsmanship first—no aggressive behavior</div>
                </div>
                <div>
                  <div className="font-bold text-lg text-red-800">隊長責任</div>
                  <div className="text-gray-700">球隊隊⻑/經理需協助維持球員良好⾏為</div>
                  <div className="text-xs text-gray-500 italic">Team captain/manager helps ensure good conduct</div>
                </div>
                <div>
                  <div className="font-bold text-lg text-red-800">裁判權威</div>
                  <div className="text-gray-700">裁判擁有最終決定權，請尊重判決</div>
                  <div className="text-xs text-gray-500 italic">Referee’s decisions are final</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-yellow-500">
                  <div className="font-bold text-yellow-900">兩黃一紅 / Two Yellows</div>
                  <div className="text-sm text-yellow-800">在一場比賽中累積兩張黃牌或領取一張紅牌的球員，必須立即離場</div>
                  <div className="text-xs text-yellow-700 italic mt-1">Two yellow cards or straight red = leave immediately</div>
                </div>
                <div className="bg-red-100 p-4 rounded-lg border-l-4 border-red-600">
                  <div className="font-bold text-red-900">紅牌停賽 / Red Card Suspension</div>
                  <div className="text-sm text-red-800">紅牌球員需即時離場，並⾃動停賽⼀場</div>
                  <div className="text-xs text-red-700 italic mt-1">Leaves immediately, suspended for next match</div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </HomeLayout>
  );
}
