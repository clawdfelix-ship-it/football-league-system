'use client';

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="btn-primary h-auto px-6 py-2 rounded font-bold shadow print:hidden"
    >
      列印出場表 (A4)
    </button>
  );
}
