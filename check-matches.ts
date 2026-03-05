
import { db } from './lib/db';
import { matches } from './lib/schema';
import { desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function main() {
  if (!db) {
    console.error('Database connection not initialized. Check your .env file.');
    process.exit(1);
  }

  console.log('Fetching matches...');
  const allMatches = await db.select().from(matches).orderBy(desc(matches.date));

  console.log(`Found ${allMatches.length} matches.`);
  
  if (allMatches.length === 0) {
    console.log('No matches found in the database.');
    return;
  }

  console.log('---------------------------------------------------------------------------------');
  console.log('| ID | Home Team | Away Team | Date       | Round      | Status     |');
  console.log('---------------------------------------------------------------------------------');
  
  allMatches.forEach(match => {
    const dateStr = match.date ? new Date(match.date).toLocaleDateString() : 'TBC';
    const roundStr = match.round || 'NULL';
    const statusStr = match.status || 'NULL';
    
    console.log(`| ${match.id.toString().padEnd(2)} | ${match.homeTeam.padEnd(9)} | ${match.awayTeam.padEnd(9)} | ${dateStr.padEnd(10)} | ${roundStr.padEnd(10)} | ${statusStr.padEnd(10)} |`);
  });
  console.log('---------------------------------------------------------------------------------');
}

main().catch(console.error).finally(() => process.exit(0));
