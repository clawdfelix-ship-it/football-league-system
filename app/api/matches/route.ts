import { NextResponse } from 'next/server';
import { listMatches } from '@/lib/queries';

export async function GET() {
  try {
    const matches = await listMatches();
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
