'use client';

export default function FixturesLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <header className="bg-[#1a237e] bg-gradient-to-b from-[#1a237e] to-[#283593] text-white pt-16 pb-24 px-6 text-center">
        <div className="mx-auto h-14 w-48 rounded-lg bg-white/20 animate-pulse" />
        <div className="mx-auto mt-3 h-5 w-56 rounded bg-white/10 animate-pulse" />
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 pb-20">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-3 mb-4 flex gap-3">
          <div className="h-11 w-24 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-11 w-24 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-11 w-24 rounded-full bg-slate-100 animate-pulse" />
        </div>

        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 animate-pulse"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-20 rounded-full bg-blue-50" />
                <div className="h-6 w-24 rounded-full bg-slate-100" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-28 rounded bg-slate-200" />
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                </div>
                <div className="h-8 w-16 rounded bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-28 rounded bg-slate-200" />
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
