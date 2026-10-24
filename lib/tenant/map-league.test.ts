import { describe, it, expect } from 'vitest';
import {
  mapResolvedToLeague,
  isLeagueServable,
  suspendedReason,
} from './map-league';
import type { ResolvedHost } from './resolve-host';

const NOW = new Date('2026-10-11T12:00:00.000Z');

const leagues = [
  { id: 1, slug: 'hkbankleague2026', status: 'active', trialEndsAt: null },
  { id: 2, slug: 'acme-cup', status: 'active', trialEndsAt: null },
  { id: 3, slug: 'frozen-league', status: 'suspended', trialEndsAt: null },
  { id: 4, slug: 'tryout', status: 'trial', trialEndsAt: null },
  { id: 5, slug: 'lapsed', status: 'trial', trialEndsAt: new Date('2026-10-01T00:00:00Z') },
  { id: 6, slug: 'fresh-trial', status: 'trial', trialEndsAt: new Date('2026-10-20T00:00:00Z') },
  { id: 7, slug: 'paid-with-old-date', status: 'active', trialEndsAt: new Date('2020-01-01T00:00:00Z') },
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
    ).toEqual({ status: 'suspended', leagueId: 3, slug: 'frozen-league', reason: 'status' });
  });
});

describe('isLeagueServable (trial expiry)', () => {
  it('active always serves, even with a past trial date', () => {
    expect(isLeagueServable(leagues[6], NOW)).toBe(true);
  });

  it('trial with no end date serves (open-ended)', () => {
    expect(isLeagueServable(leagues[3], NOW)).toBe(true);
  });

  it('trial with a future end date serves', () => {
    expect(isLeagueServable(leagues[5], NOW)).toBe(true);
  });

  it('trial with a past end date is NOT servable', () => {
    expect(isLeagueServable(leagues[4], NOW)).toBe(false);
  });

  it('an end date exactly equal to now is treated as lapsed', () => {
    expect(
      isLeagueServable({ status: 'trial', trialEndsAt: NOW }, NOW)
    ).toBe(false);
  });

  it('accepts an ISO string trial date', () => {
    expect(
      isLeagueServable({ status: 'trial', trialEndsAt: '2026-10-20T00:00:00Z' }, NOW)
    ).toBe(true);
    expect(
      isLeagueServable({ status: 'trial', trialEndsAt: '2026-10-01T00:00:00Z' }, NOW)
    ).toBe(false);
  });

  it('pending/suspended/closed never serve', () => {
    expect(isLeagueServable({ status: 'pending', trialEndsAt: null }, NOW)).toBe(false);
    expect(isLeagueServable({ status: 'suspended', trialEndsAt: null }, NOW)).toBe(false);
    expect(isLeagueServable({ status: 'closed', trialEndsAt: null }, NOW)).toBe(false);
  });

  it('reports trial_expired reason for a lapsed trial and status otherwise', () => {
    expect(suspendedReason(leagues[4], NOW)).toBe('trial_expired');
    expect(suspendedReason(leagues[2], NOW)).toBe('status');
  });
});

describe('mapResolvedToLeague trial expiry', () => {
  it('a lapsed-trial tenant host resolves to suspended(trial_expired)', () => {
    expect(
      mapResolvedToLeague(host({ kind: 'tenant', slug: 'lapsed', leagueId: null }), leagues)
    ).toEqual({ status: 'suspended', leagueId: 5, slug: 'lapsed', reason: 'trial_expired' });
  });

  it('a fresh-trial tenant host resolves to ok', () => {
    expect(
      mapResolvedToLeague(host({ kind: 'tenant', slug: 'fresh-trial', leagueId: null }), leagues, NOW)
      .status
    ).toBe('ok');
  });

  it('default host for a lapsed founding league resolves to suspended', () => {
    const dir = [
      { id: 1, slug: 'hkbankleague2026', status: 'trial', trialEndsAt: new Date('2020-01-01') },
    ];
    expect(
      mapResolvedToLeague(host({ kind: 'default', slug: 'hkbankleague2026', leagueId: 1 }), dir)
    ).toMatchObject({ status: 'suspended', reason: 'trial_expired', leagueId: 1 });
  });
});
