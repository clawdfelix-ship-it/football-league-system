import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/authz';
import { createMatch, listMatches } from '@/lib/queries';
import { fail, ok } from '@/lib/api/response';
import { CreateMatchSchema, MatchStatusSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';

// GET all matches
export const revalidate = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const allMatches = await listMatches(
      status ? MatchStatusSchema.safeParse(status).data : undefined
    );
    
    return ok({ matches: allMatches });
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch matches');
  }
}

// POST - Add new match
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return fail(401, 'UNAUTHORIZED', 'Unauthorized');
    }
    if (auth.role !== 'admin') {
      return fail(403, 'FORBIDDEN', 'Forbidden');
    }

    const body = CreateMatchSchema.parse(await request.json());
    const status = body.status ?? 'scheduled';
    
    const row = await createMatch({
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      homeScore: body.homeScore ?? null,
      awayScore: body.awayScore ?? null,
      date: body.date ?? null,
      venue: body.venue ?? 'TBC',
      status,
      round: body.round ?? null,
    });

    if (!row) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to add match');
    }
    
    return ok({ match: row }, { status: 201 });
  } catch (error) {
    console.error('Failed to add match:', error);
    const details = zodDetails(error);
    if (details) return fail(400, 'VALIDATION_ERROR', 'Invalid request body', details);
    return fail(500, 'INTERNAL_ERROR', 'Failed to add match');
  }
}
