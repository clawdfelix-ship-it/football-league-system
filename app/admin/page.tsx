import Link from "next/link";

// Mock data for admin page
const mockRecentMatches = [
  {
    id: 1,
    homeTeam: "曼城",
    awayTeam: "利物浦",
    homeScore: 2,
    awayScore: 1,
    date: new Date("2026-02-20"),
    venue: "伊蒂哈德球場",
    status: "finished",
  },
  {
    id: 2,
    homeTeam: "阿森納",
    awayTeam: "切爾西",
    homeScore: 1,
    awayScore: 1,
    date: new Date("2026-02-21"),
    venue: "酋長球場",
    status: "finished",
  },
  {
    id: 3,
    homeTeam: "利物浦",
    awayTeam: "阿森納",
    homeScore: 3,
    awayScore: 0,
    date: new Date("2026-02-22"),
    venue: "晏菲路球場",
    status: "finished",
  },
  {
    id: 4,
    homeTeam: "切爾西",
    awayTeam: "曼城",
    homeScore: 1,
    awayScore: 2,
    date: new Date("2026-02-23"),
    venue: "斯坦福橋",
    status: "finished",
  },
];

async function submitMatch(formData: FormData) {
  "use server";

  const homeTeam = formData.get("homeTeam")?.toString().trim() ?? "";
  const awayTeam = formData.get("awayTeam")?.toString().trim() ?? "";
  const homeScoreRaw = formData.get("homeScore")?.toString();
  const awayScoreRaw = formData.get("awayScore")?.toString();
  const dateRaw = formData.get("date")?.toString();
  const venueRaw = formData.get("venue")?.toString().trim();

  if (!homeTeam || !awayTeam || homeScoreRaw == null || awayScoreRaw == null) {
    return;
  }

  const homeScore = Number(homeScoreRaw);
  const awayScore = Number(awayScoreRaw);

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return;
  }

  // In mock mode, we just simulate the submission
  console.log(`Mock: Added match ${homeTeam} ${homeScore}-${awayScore} ${awayTeam} at ${venueRaw || "未知場地"}`);
}

export default async function AdminPage() {
  // Use mock data instead of database query
  const recentMatches = mockRecentMatches;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            管理比賽結果
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            新增比賽結果後，首頁的積分榜與賽程會自動更新。
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <h2 className="text-lg font-semibold">新增比賽結果</h2>
          <form action={submitMatch} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="homeTeam"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  主隊名稱
                </label>
                <input
                  id="homeTeam"
                  name="homeTeam"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="例如：曼城"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="awayTeam"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  客隊名稱
                </label>
                <input
                  id="awayTeam"
                  name="awayTeam"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="例如：利物浦"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="homeScore"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  主隊得分
                </label>
                <input
                  id="homeScore"
                  name="homeScore"
                  type="number"
                  min="0"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="2"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="awayScore"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  客隊得分
                </label>
                <input
                  id="awayScore"
                  name="awayScore"
                  type="number"
                  min="0"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="date"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  比賽日期
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="venue"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  比賽場地
                </label>
                <input
                  id="venue"
                  name="venue"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                  placeholder="例如：老特拉福德球場"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus:ring-zinc-500 dark:focus:ring-offset-zinc-950"
            >
              提交比賽結果
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">最近比賽</h2>
            <Link
              href="/"
              className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              返回首頁
            </Link>
          </div>
          <div className="space-y-3">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <div className="font-semibold">
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {match.venue}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold">
                    {match.homeScore} - {match.awayScore}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(match.date).toLocaleDateString("zh-CN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}