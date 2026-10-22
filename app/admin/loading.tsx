export default function AdminLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 py-16">
      {/* Branded spinner */}
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#0f172a]/15 border-t-[#0f172a]"
        role="status"
        aria-label="載入中"
      />
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">載入後台中…</p>
        <p className="mt-1 text-xs text-slate-400">正在準備球賽安排，請稍候</p>
      </div>
    </div>
  );
}
