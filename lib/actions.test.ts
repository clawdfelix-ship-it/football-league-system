import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  createAnnouncement: vi.fn(),
  createMatch: vi.fn(),
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
  revalidateTag: vi.fn(),
  resolveTeamId: vi.fn(),
  setPlayerPhotoUrlById: vi.fn(),
  updateMatchById: vi.fn(),
  updatePlayerById: vi.fn(),
  put: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: mocks.revalidateTag,
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}));

vi.mock('@vercel/blob', () => ({
  put: mocks.put,
}));

vi.mock('@/lib/authz', () => ({
  getAuthContext: mocks.getAuthContext,
  getTeamNameFromTeamId: vi.fn(),
}));

vi.mock('@/lib/queries', () => ({
  createAnnouncement: mocks.createAnnouncement,
  createMatch: mocks.createMatch,
  deleteAllMatches: mocks.deleteAllMatches,
  deleteAnnouncementById: mocks.deleteAnnouncementById,
  deleteMatchById: mocks.deleteMatchById,
  deletePlayerById: mocks.deletePlayerById,
  getPlayerTeamById: mocks.getPlayerTeamById,
  listAnnouncements: mocks.listAnnouncements,
  listMatches: mocks.listMatches,
  listPlayers: mocks.listPlayers,
  listPlayersByTeam: mocks.listPlayersByTeam,
  listTeamSettings: mocks.listTeamSettings,
  resolveTeamId: mocks.resolveTeamId,
  setPlayerPhotoUrlById: mocks.setPlayerPhotoUrlById,
  updateMatchById: mocks.updateMatchById,
  updatePlayerById: mocks.updatePlayerById,
}));

import {
  addAnnouncement,
  addMatch,
  deleteAnnouncement,
  deleteMatch,
  updateMatch,
} from '@/lib/actions';

describe('admin-only server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthContext.mockResolvedValue(null);
    mocks.createAnnouncement.mockResolvedValue({ id: 1 });
    mocks.createMatch.mockResolvedValue({ id: 1 });
    mocks.updateMatchById.mockResolvedValue({ id: 1 });
  });

  it('blocks match mutations without admin auth', async () => {
    await expect(
      addMatch({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'scheduled',
      }),
    ).rejects.toThrow('Forbidden: admin only');

    await expect(updateMatch(1, { status: 'finished' })).rejects.toThrow('Forbidden: admin only');

    await expect(deleteMatch(1)).resolves.toEqual({
      success: false,
      message: 'Forbidden: admin only',
    });

    expect(mocks.createMatch).not.toHaveBeenCalled();
    expect(mocks.updateMatchById).not.toHaveBeenCalled();
    expect(mocks.deleteMatchById).not.toHaveBeenCalled();
  });

  it('blocks announcement mutations without admin auth', async () => {
    await expect(
      addAnnouncement({
        title: 'Notice',
        content: 'Venue changed',
        date: new Date('2026-09-27T10:00:00Z'),
      }),
    ).resolves.toEqual({
      success: false,
      message: 'Forbidden: admin only',
    });

    await expect(deleteAnnouncement(12)).resolves.toEqual({
      success: false,
      message: 'Forbidden: admin only',
    });

    expect(mocks.createAnnouncement).not.toHaveBeenCalled();
    expect(mocks.deleteAnnouncementById).not.toHaveBeenCalled();
  });

  it('allows admins to execute protected mutations', async () => {
    mocks.getAuthContext.mockResolvedValue({ role: 'admin' });
    mocks.deleteMatchById.mockResolvedValue(undefined);
    mocks.deleteAnnouncementById.mockResolvedValue(undefined);

    await addMatch({
      homeTeam: 'A',
      awayTeam: 'B',
      status: 'scheduled',
    });
    await updateMatch(7, { venue: 'Pitch 1' });
    await deleteMatch(9);
    await addAnnouncement({
      content: 'Updated',
      date: new Date('2026-09-27T10:00:00Z'),
    });
    await deleteAnnouncement(5);

    expect(mocks.createMatch).toHaveBeenCalledOnce();
    expect(mocks.updateMatchById).toHaveBeenCalledWith(7, { venue: 'Pitch 1', date: undefined });
    expect(mocks.deleteMatchById).toHaveBeenCalledWith(9);
    expect(mocks.createAnnouncement).toHaveBeenCalledOnce();
    expect(mocks.deleteAnnouncementById).toHaveBeenCalledWith(5);
  });
});
