import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB-backed directory before importing the unit under test.
vi.mock('./leagues', () => ({
  listLeagueDirectory: vi.fn(),
}));

import { listLeagueDirectory } from './leagues';
import { resolveLeagueIdForHost } from './resolve-league.server';
import { DEFAULT_LEAGUE_ID } from './config';

const dir = vi.mocked(listLeagueDirectory);

// Two servable leagues (founding + one tenant), one suspended tenant.
const DIRECTORY = [
  { id: DEFAULT_LEAGUE_ID, slug: 'hkbankleague2026', name: 'Founding', status: 'active' as const },
  { id: 2, slug: 'summer-cup', name: 'Summer', status: 'trial' as const },
  { id: 3, slug: 'dead-league', name: 'Dead', status: 'suspended' as const },
];

beforeEach(() => {
  dir.mockReset();
});

describe('resolveLeagueIdForHost', () => {
  it('returns 0 for the platform apex/admin host without touching the directory', async () => {
    expect(await resolveLeagueIdForHost('zenex-sports.com')).toBe(0);
    expect(await resolveLeagueIdForHost('admin.zenex-sports.com')).toBe(0);
    expect(dir).not.toHaveBeenCalled();
  });

  it('maps vercel.app / localhost / unknown apex to the founding league when active', async () => {
    dir.mockResolvedValue(DIRECTORY);
    expect(await resolveLeagueIdForHost('football-league-system-zenex.vercel.app')).toBe(
      DEFAULT_LEAGUE_ID
    );
    expect(await resolveLeagueIdForHost('localhost:3000')).toBe(DEFAULT_LEAGUE_ID);
  });

  it('resolves a real tenant subdomain to its own league id', async () => {
    dir.mockResolvedValue(DIRECTORY);
    expect(await resolveLeagueIdForHost('summer-cup.zenex-sports.com')).toBe(2);
  });

  it('returns 0 for an unknown subdomain (no slug match)', async () => {
    dir.mockResolvedValue(DIRECTORY);
    expect(await resolveLeagueIdForHost('ghost.zenex-sports.com')).toBe(0);
  });

  it('returns 0 for a suspended tenant', async () => {
    dir.mockResolvedValue(DIRECTORY);
    expect(await resolveLeagueIdForHost('dead-league.zenex-sports.com')).toBe(0);
  });

  it('returns 0 for a tenant subdomain missing from an empty directory', async () => {
    dir.mockResolvedValue([]);
    expect(await resolveLeagueIdForHost('summer-cup.zenex-sports.com')).toBe(0);
  });
});
