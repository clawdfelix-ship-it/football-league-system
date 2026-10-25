import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getTeamAssociationsSpy, deleteTeamCascadeSpy } = vi.hoisted(() => ({
  getTeamAssociationsSpy: vi.fn(),
  deleteTeamCascadeSpy: vi.fn(),
}));

vi.mock('@/lib/authz', () => ({
  getAuthContext: vi.fn(async () => ({ role: 'admin', leagueId: 1 })),
}));

vi.mock('@/lib/tenant/context', () => ({
  getRequestLeagueId: vi.fn(async () => 1),
}));

vi.mock('@/lib/tenant/teams.server', () => ({
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  deleteTeamCascade: deleteTeamCascadeSpy,
  getTeamAssociations: getTeamAssociationsSpy,
  TeamError: class TeamError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

import { DELETE } from './route';

describe('DELETE /api/teams/[id]', () => {
  beforeEach(() => {
    getTeamAssociationsSpy.mockReset();
    deleteTeamCascadeSpy.mockReset();
  });

  it('returns association data for dry-run requests without deleting the team', async () => {
    getTeamAssociationsSpy.mockResolvedValue({ playerCount: 3, matchCount: 0 });

    const response = await DELETE(
      new NextRequest('http://localhost/api/teams/10?dryRun=true', { method: 'DELETE' }),
      { params: Promise.resolve({ id: '10' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        teamId: 10,
        playerCount: 3,
        matchCount: 0,
        dryRun: true,
      },
    });
    expect(deleteTeamCascadeSpy).not.toHaveBeenCalled();
  });
});
