import { describe, it, expect } from 'vitest';
import { mapResolvedToLeague } from './map-league';
import type { ResolvedHost } from './resolve-host';

const leagues = [
  { id: 1, slug: 'hkbankleague2026', status: 'active' },
  { id: 2, slug: 'acme-cup', status: 'active' },
  { id: 3, slug: 'frozen-league', status: 'suspended' },
  { id: 4, slug: 'tryout', status: 'trial' },
];

const host = (r: Partial<ResolvedHost>): ResolvedHost => ({
  kind: 'default',
  slug: 'hkbankleague2026',
  leagueId: 1,
  host: 'x',
  ...r,
});

describe('mapResolvedToLeague', () => {
  it('returns platform for platform host', () => {
    expect(
      mapResolvedToLeague(host({ kind: 'platform', slug: null, leagueId: null }), leagues)
    ).toEqual({ status: 'platform' });
  });

  it('default host maps to the founding league', () => {
    expect(
      mapResolvedToLeague(host({ kind: 'default', slug: 'hkbankleague2026', leagueId: 1 }), leagues)
    ).toEqual({ status: 'ok', leagueId: 1, slug: 'hkbankleague2026' });
  });

  it('tenant host matches slug to an active league', () => {
    expect(
      mapResolvedToLeague(host({ kind: 'tenant', slug: 'acme-cup', leagueId: null }), leagues)
    ).toEqual({ status: 'ok', leagueId: 2, slug: 'acme-cup' });
  });

  it('serves trial leagues', () => {
    expect(
      mapResolvedToLeague(host({ kind: 'tenant', slug: 'tryout', leagueId: null }), leagues).status
    ).toBe('ok');
  });

  it('does NOT guess for an unknown tenant slug', () => {
    expect(
      mapResolvedToLeague(host({ kind: 'tenant', slug: 'typo-cup', leagueId: null }), leagues)
    ).toEqual({ status: 'unknown_slug', slug: 'typo-cup' });
  });

  it('flags a suspended league distinctly', () => {
    expect(
      mapResolvedToLeague(
        host({ kind: 'tenant', slug: 'frozen-league', leagueId: null }),
        leagues
      )
    ).toEqual({ status: 'suspended', leagueId: 3, slug: 'frozen-league' });
  });
});
