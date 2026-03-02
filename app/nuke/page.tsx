import { db, sql } from '@/lib/db';
import { matches } from '@/lib/schema';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NukePage() {
  noStore();
  
  let message = '';
  let error = '';
  let count = 0;
  
  try {
    console.log("Nuke page accessed");
    
    // Check if DB is connected
    if (!sql) throw new Error('DB Connection Failed: sql is null');
    const test = await sql`SELECT 1`;
    if (!test) throw new Error('DB Connection Failed');

    // Delete all matches
    const result = await db.delete(matches).returning();
    count = result.length;
    message = `Successfully deleted ${count} matches. Database should be empty now.`;
  } catch (e: any) {
    console.error(e);
    error = e.message || JSON.stringify(e);
  }

  return (
    <div className="p-10 font-mono">
      <h1 className="text-2xl font-bold mb-4">☢️ NUKE DATABASE ☢️</h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <pre className="whitespace-pre-wrap">{error}</pre>
          <p className="mt-2 text-sm">Check Vercel Environment Variables (DATABASE_URL).</p>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">Success!</p>
          <p>{message}</p>
        </div>
      )}
      
      <div className="mt-8">
        <a href="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Back to Home
        </a>
      </div>
    </div>
  );
}