import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthContext,
  createMatch,
  createAnnouncement,
  revalidateTag,
} = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  createMatch: vi.fn(),
  createAnnouncement: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag,
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock('@/lib/authz', () => ({
  getAuthContext,
  getTeamNameFromTeamId: vi.fn(),
}));

vi.mock('@/lib/queries', () => ({
  createAnnouncement,
  createMatch,
  deleteAllMatches: vi.fn(),
  deleteAnnouncementById: vi.fn(),
  deleteMatchById: vi.fn(),
  deletePlayerById: vi.fn(),
  getPlayerTeamById: vi.fn(),
  listAnnouncements: vi.fn(),
  listMatches: vi.fn(),
  listPlayers: vi.fn(),
  listPlayersByTeam: vi.fn(),
  listTeamSettings: vi.fn(),
  resolveTeamId: vi.fn(),
  setPlayerPhotoUrlById: vi.fn(),
  updateMatchById: vi.fn(),
  updatePlayerById: vi.fn(),
}));

import { addAnnouncement, addMatch } from '@/lib/actions';

describe('admin-only server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated match creation', async () => {
    getAuthContext.mockResolvedValue(null);

    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'scheduled',
      })
    ).rejects.toThrow('Forbidden: admin only');

    expect(createMatch).not.toHaveBeenCalled();
  });

  it('rejects non-admin announcement creation', async () => {
    getAuthContext.mockResolvedValue({ role: 'manager', teamId: 1 });

    await expect(
      addAnnouncement({
        title: 'Notice',
        content: 'Moved venue',
        date: new Date('2026-10-01T12:00:00Z'),
      })
    ).rejects.toThrow('Forbidden: admin only');

    expect(createAnnouncement).not.toHaveBeenCalled();
  });

  it('allows admins to create matches', async () => {
    const created = { id: 7 };
    getAuthContext.mockResolvedValue({ role: 'admin' });
    createMatch.mockResolvedValue(created);

    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'finished',
        homeScore: 2,
        awayScore: 1,
      })
    ).resolves.toEqual(created);

    expect(createMatch).toHaveBeenCalledOnce();
    expect(revalidateTag).toHaveBeenCalledOnce();
  });
});
