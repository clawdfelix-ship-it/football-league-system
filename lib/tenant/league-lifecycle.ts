/**
 * League lifecycle state machine (pure).
 *
 * Pure guards for legal league-status transitions. No DB access; safe for both
 * server routes and tests. See docs/platform-console-p0-spec.md §3.4 for the
 * full transition table.
 *
 * Why pure: state machines are easy to get wrong when they live inside route
 * handlers. Keeping the rules pure means they can be unit-tested without
 * mocking the DB, and the same guard can be reused by both the new league
 * status routes and any future provisioning flow.
 */

export type LeagueLifecycleStatus =
  | 'pending'
  | 'trial'
  | 'active'
  | 'suspended'
  | 'closed';

export class LeagueError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'LeagueError';
    this.code = code;
  }
}

/**
 * Allowed transitions. `closed` is terminal (no exit). Self-transitions are
 * rejected so callers can't silently no-op a status update (which would lose
 * audit history).
 */
const TRANSITIONS: Readonly<Record<LeagueLifecycleStatus, ReadonlySet<LeagueLifecycleStatus>>> = {
  pending: new Set(['active', 'closed']),
  trial: new Set(['active', 'suspended', 'closed']),
  active: new Set(['suspended', 'closed']),
  suspended: new Set(['active', 'closed']),
  closed: new Set(),
};

export function canTransitionLeague(
  from: LeagueLifecycleStatus,
  to: LeagueLifecycleStatus
): boolean {
  return TRANSITIONS[from]?.has(to) ?? false;
}

/**
 * Throw LeagueError('INVALID_TRANSITION') if the transition is not allowed.
 * Returns void on success.
 */
export function assertLeagueTransition(
  from: LeagueLifecycleStatus,
  to: LeagueLifecycleStatus
): void {
  if (!canTransitionLeague(from, to)) {
    throw new LeagueError(
      'INVALID_TRANSITION',
      `Cannot transition league from '${from}' to '${to}'`
    );
  }
}
