import { beforeEach, describe, expect, it, vi } from 'vitest';

const listTeamNames = vi.fn();

vi.mock('@/lib/queries', () => ({
  listTeamNames,
  deleteAllMatches: vi.fn(),
}));

describe('GET /api/teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only teams from the current tenant league', async () => {
    listTeamNames.mockResolvedValue(['Zenex FC']);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        teams: ['Zenex FC'],
      },
    });
    expect(listTeamNames).toHaveBeenCalled();
  });

  it('returns an empty list when the request is not bound to a tenant', async () => {
    listTeamNames.mockResolvedValue([]);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        teams: [],
      },
    });
    expect(listTeamNames).toHaveBeenCalled();
  });
});
