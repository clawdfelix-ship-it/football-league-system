'use client';

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow hover:bg-blue-700 print:hidden"
    >
      列印出場表 (A4)
    </button>
  );
}
