import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { listMatches } from '@/lib/queries';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/matches/ical?team=NOMURA (optional filter)
 *
 * Returns an iCalendar (.ics) feed of all matches for the current league.
 * Managers / players can subscribe in Google Calendar / Apple Calendar.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 30 req / 10 min per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`ical:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  try {
    const leagueId = await getRequestLeagueId();
    const teamFilter = request.nextUrl.searchParams.get('team')?.trim().toUpperCase() || null;

    const matches = await listMatches(undefined, leagueId);

    const filtered = teamFilter
      ? matches.filter((m) => m.homeTeam === teamFilter || m.awayTeam === teamFilter)
      : matches;

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Zenex Sports//League Fixtures//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${teamFilter ? `${teamFilter} Fixtures` : 'League Fixtures'}`,
      `X-WR-TIMEZONE:Asia/Hong_Kong`,
    ];

    for (const m of filtered) {
      if (!m.date) continue; // skip unscheduled TBC matches
      const dt = new Date(m.date);
      const uid = `match-${m.id}@zenex-sports.com`;
      const dtstamp = dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtstart = dtstamp;
      // Assume 90 min match
      const dtend = new Date(dt.getTime() + 90 * 60 * 1000)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';

      const summary = teamFilter
        ? `${m.homeTeam} vs ${m.awayTeam}`
        : `${m.homeTeam} vs ${m.awayTeam} (${m.venue || 'TBC'})`;

      const description = [
        m.round ? `Round ${m.round}` : null,
        m.venue ? `Venue: ${m.venue}` : null,
        m.status === 'finished' ? `Result: ${m.homeScore ?? '?'}-${m.awayScore ?? '?'}` : null,
      ]
        .filter(Boolean)
        .join('\\n');

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${m.venue || 'TBC'}`,
        `STATUS:${m.status === 'finished' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT',
      );
    }

    lines.push('END:VCALENDAR');

    return new Response(lines.join('\r\n'), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${teamFilter ? `${teamFilter}-fixtures` : 'league-fixtures'}.ics"`,
        'Cache-Control': 'public, max-age=300', // 5 min cache
      },
    });
  } catch (e) {
    console.error('[ical] unexpected error:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to generate calendar');
  }
}
