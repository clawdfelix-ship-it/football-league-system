import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./leagues', () => ({
  listLeagueDirectory: vi.fn(),
}));

import { listLeagueDirectory } from './leagues';
import { resolveLeagueIdForRequest } from './request-league';
import { DEFAULT_LEAGUE_ID } from './config';

const dir = vi.mocked(listLeagueDirectory);

const DIRECTORY = [
  { id: DEFAULT_LEAGUE_ID, slug: 'hkbankleague2026', name: 'Founding', status: 'active' as const },
  { id: 2, slug: 'summer-cup', name: 'Summer Cup', status: 'active' as const },
];

describe('resolveLeagueIdForRequest', () => {
  beforeEach(() => {
    dir.mockReset();
  });

  it('resolves a tenant auth request from the raw Host header without middleware headers', async () => {
    dir.mockResolvedValue(DIRECTORY);

    const request = new Request('https://summer-cup.zenex-sports.com/api/auth/forgot-password');

    await expect(resolveLeagueIdForRequest(request)).resolves.toBe(2);
  });

  it('returns 0 on the platform host', async () => {
    const request = new Request('https://zenex-sports.com/api/auth/reset-password');

    await expect(resolveLeagueIdForRequest(request)).resolves.toBe(0);
    expect(dir).not.toHaveBeenCalled();
  });
});
