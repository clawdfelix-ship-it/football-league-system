import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCreateAnnouncement,
  mockCreateMatch,
  mockGetAuthContext,
  mockGetMatchById,
  mockRevalidateTag,
  mockUpdateMatchById,
} = vi.hoisted(() => ({
  mockCreateAnnouncement: vi.fn(),
  mockCreateMatch: vi.fn(),
  mockGetAuthContext: vi.fn(),
  mockGetMatchById: vi.fn(),
  mockRevalidateTag: vi.fn(),
  mockUpdateMatchById: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: mockRevalidateTag,
}));

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}));

vi.mock('./db', () => ({
  db: {},
}));

vi.mock('./schema', () => ({
  matches: {},
  players: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

vi.mock('@/lib/authz', () => ({
  getAuthContext: mockGetAuthContext,
  getTeamNameFromTeamId: vi.fn(),
}));

vi.mock('@/lib/fixtures-data', () => ({
  FIXTURES_CACHE_TAG: 'fixtures',
}));

vi.mock('@/lib/queries', () => ({
  createAnnouncement: mockCreateAnnouncement,
  createMatch: mockCreateMatch,
  deleteAllMatches: vi.fn(),
  deleteAnnouncementById: vi.fn(),
  deleteMatchById: vi.fn(),
  deletePlayerById: vi.fn(),
  getMatchById: mockGetMatchById,
  getPlayerTeamById: vi.fn(),
  listAnnouncements: vi.fn(),
  listMatches: vi.fn(),
  listPlayers: vi.fn(),
  listPlayersByTeam: vi.fn(),
  listTeamSettings: vi.fn(),
  resolveTeamId: vi.fn(),
  setPlayerPhotoUrlById: vi.fn(),
  updateMatchById: mockUpdateMatchById,
  updatePlayerById: vi.fn(),
}));

import { addAnnouncement, addMatch, updateMatch } from './actions';

describe('admin server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMatchById.mockResolvedValue(null);
  });

  it('rejects unauthenticated match creation before writing', async () => {
    mockGetAuthContext.mockResolvedValue(null);

    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'scheduled',
        date: new Date('2026-10-03T10:00:00Z'),
      })
    ).rejects.toThrow('Forbidden: admin only');

    expect(mockCreateMatch).not.toHaveBeenCalled();
  });

  it('rejects finished match creation without both scores', async () => {
    mockGetAuthContext.mockResolvedValue({ role: 'admin' });

    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'finished',
        date: new Date('2026-10-03T10:00:00Z'),
        homeScore: 2,
      })
    ).rejects.toThrow('Finished matches require both scores');

    expect(mockCreateMatch).not.toHaveBeenCalled();
  });

  it('allows finished match updates when existing scores are already present', async () => {
    mockGetAuthContext.mockResolvedValue({ role: 'admin' });
    mockGetMatchById.mockResolvedValue({ homeScore: 3, awayScore: 1 });
    mockUpdateMatchById.mockResolvedValue({ id: 8 });

    await updateMatch(8, {
      status: 'finished',
      venue: 'Happy Valley',
    });

    expect(mockGetMatchById).toHaveBeenCalledWith(8);
    expect(mockUpdateMatchById).toHaveBeenCalledWith(
      8,
      expect.objectContaining({
        status: 'finished',
        venue: 'Happy Valley',
      })
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith('fixtures', 'max');
  });

  it('blocks announcement creation for non-admin callers', async () => {
    mockGetAuthContext.mockResolvedValue({ role: 'manager', teamId: 1 });

    const result = await addAnnouncement({
      title: 'Notice',
      content: 'Changed venue',
      date: new Date('2026-10-03T10:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      message: 'Forbidden: admin only',
    });
    expect(mockCreateAnnouncement).not.toHaveBeenCalled();
  });
});
