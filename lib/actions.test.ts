import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAuthContext,
  mockCreateMatch,
  mockUpdateMatchById,
  mockDeleteMatchById,
  mockCreateAnnouncement,
  mockDeleteAnnouncementById,
} = vi.hoisted(() => ({
  mockGetAuthContext: vi.fn(),
  mockCreateMatch: vi.fn(),
  mockUpdateMatchById: vi.fn(),
  mockDeleteMatchById: vi.fn(),
  mockCreateAnnouncement: vi.fn(),
  mockDeleteAnnouncementById: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}));

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}));

vi.mock('@/lib/authz', () => ({
  getAuthContext: mockGetAuthContext,
  getTeamNameFromTeamId: vi.fn(),
}));

vi.mock('@/lib/queries', () => ({
  createAnnouncement: mockCreateAnnouncement,
  createMatch: mockCreateMatch,
  deleteAllMatches: vi.fn(),
  deleteAnnouncementById: mockDeleteAnnouncementById,
  deleteMatchById: mockDeleteMatchById,
  deletePlayerById: vi.fn(),
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

import { addAnnouncement, addMatch, deleteAnnouncement } from '@/lib/actions';

describe('high-privilege server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects direct addMatch invocation from non-admin callers', async () => {
    mockGetAuthContext.mockResolvedValue({ role: 'manager', teamId: 1 });

    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'scheduled',
      })
    ).rejects.toThrow('Forbidden: admin only');

    expect(mockCreateMatch).not.toHaveBeenCalled();
  });

  it('allows addMatch for admins', async () => {
    mockGetAuthContext.mockResolvedValue({ role: 'admin' });
    mockCreateMatch.mockResolvedValue({ id: 99 });

    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'scheduled',
      })
    ).resolves.toEqual({ id: 99 });

    expect(mockCreateMatch).toHaveBeenCalledOnce();
  });

  it('returns a forbidden error for announcement deletion by non-admin callers', async () => {
    mockGetAuthContext.mockResolvedValue(null);

    await expect(deleteAnnouncement(5)).resolves.toEqual({
      success: false,
      message: 'Forbidden: admin only',
    });

    expect(mockDeleteAnnouncementById).not.toHaveBeenCalled();
  });

  it('creates announcements for admins', async () => {
    const now = new Date('2026-09-28T00:00:00.000Z');
    mockGetAuthContext.mockResolvedValue({ role: 'admin' });
    mockCreateAnnouncement.mockResolvedValue({ id: 7, content: 'hello', date: now });

    await expect(
      addAnnouncement({
        content: 'hello',
        date: now,
      })
    ).resolves.toEqual({
      success: true,
      announcement: { id: 7, content: 'hello', date: now },
    });
  });
});
