import { beforeEach, describe, expect, it, vi } from 'vitest';

const revalidateTag = vi.fn();
const getAuthContext = vi.fn();
const createMatch = vi.fn();
const updateMatchById = vi.fn();
const deleteMatchById = vi.fn();
const createAnnouncement = vi.fn();
const deleteAnnouncementById = vi.fn();

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
  deleteAnnouncementById,
  deleteMatchById,
  deletePlayerById: vi.fn(),
  getPlayerTeamById: vi.fn(),
  listAnnouncements: vi.fn(),
  listMatches: vi.fn(),
  listPlayers: vi.fn(),
  listPlayersByTeam: vi.fn(),
  listTeamSettings: vi.fn(),
  resolveTeamId: vi.fn(),
  setPlayerPhotoUrlById: vi.fn(),
  updateMatchById,
  updatePlayerById: vi.fn(),
}));

describe('privileged server actions', () => {
  beforeEach(() => {
    revalidateTag.mockReset();
    getAuthContext.mockReset();
    createMatch.mockReset();
    updateMatchById.mockReset();
    deleteMatchById.mockReset();
    createAnnouncement.mockReset();
    deleteAnnouncementById.mockReset();
  });

  it('rejects addMatch without an admin session', async () => {
    getAuthContext.mockResolvedValue(null);

    const { addMatch } = await import('@/lib/actions');

    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'scheduled',
      })
    ).rejects.toThrow('Forbidden: admin only');

    expect(createMatch).not.toHaveBeenCalled();
  });

  it('allows addMatch for admins and revalidates fixtures', async () => {
    const created = { id: 99 };
    getAuthContext.mockResolvedValue({ role: 'admin' });
    createMatch.mockResolvedValue(created);

    const { addMatch } = await import('@/lib/actions');
    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'scheduled',
      })
    ).resolves.toBe(created);

    expect(createMatch).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });
});
