import { describe, it, expect } from 'vitest';
import {
  canTransitionLeague,
  assertLeagueTransition,
  LeagueError,
  type LeagueLifecycleStatus,
} from './league-lifecycle';

describe('canTransitionLeague', () => {
  it('active -> suspended | closed', () => {
    expect(canTransitionLeague('active', 'suspended')).toBe(true);
    expect(canTransitionLeague('active', 'closed')).toBe(true);
  });

  it('suspended -> active | closed', () => {
    expect(canTransitionLeague('suspended', 'active')).toBe(true);
    expect(canTransitionLeague('suspended', 'closed')).toBe(true);
  });

  it('closed is terminal — no exit transitions', () => {
    expect(canTransitionLeague('closed', 'active')).toBe(false);
    expect(canTransitionLeague('closed', 'suspended')).toBe(false);
    expect(canTransitionLeague('closed', 'closed')).toBe(false);
  });

  it('trial -> active | suspended | closed', () => {
    expect(canTransitionLeague('trial', 'active')).toBe(true);
    expect(canTransitionLeague('trial', 'suspended')).toBe(true);
    expect(canTransitionLeague('trial', 'closed')).toBe(true);
  });

  it('pending -> active | closed (skip suspend from pending)', () => {
    expect(canTransitionLeague('pending', 'active')).toBe(true);
    expect(canTransitionLeague('pending', 'closed')).toBe(true);
    expect(canTransitionLeague('pending', 'suspended')).toBe(false);
  });

  it('rejects no-op self-transitions', () => {
    expect(canTransitionLeague('active', 'active')).toBe(false);
    expect(canTransitionLeague('suspended', 'suspended')).toBe(false);
    expect(canTransitionLeague('trial', 'trial')).toBe(false);
    expect(canTransitionLeague('pending', 'pending')).toBe(false);
  });
});

describe('assertLeagueTransition', () => {
  it('returns void for legal transition', () => {
    expect(() => assertLeagueTransition('active', 'suspended')).not.toThrow();
  });

  it('throws LeagueError with code INVALID_TRANSITION for illegal transition', () => {
    try {
      assertLeagueTransition('closed', 'active');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(LeagueError);
      expect((e as LeagueError).code).toBe('INVALID_TRANSITION');
      expect((e as LeagueError).message).toMatch(/closed.*active/i);
    }
  });

  it('error message names both states for support debugging', () => {
    expect(() => assertLeagueTransition('active', 'active')).toThrow(/active.*active/i);
  });
});

describe('LeagueError', () => {
  it('carries code + message', () => {
    const err = new LeagueError('NOT_FOUND', 'League not found');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('League not found');
    expect(err).toBeInstanceOf(Error);
  });
});
