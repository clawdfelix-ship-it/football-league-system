import { describe, expect, it } from 'vitest';
import {
  MATCHES_TABLE_BOOTSTRAP_SQL,
  PLAYERS_TABLE_BOOTSTRAP_SQL,
  TEAMS_TABLE_BOOTSTRAP_SQL,
  USERS_TABLE_BOOTSTRAP_SQL,
} from '@/lib/migrations';

describe('runtime migration bootstrap SQL', () => {
  it('backfills the users columns required by password-management flows', () => {
    const joined = USERS_TABLE_BOOTSTRAP_SQL.join('\n');
    expect(joined).toContain('ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password TIMESTAMP;');
    expect(joined).toContain('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;');
    expect(joined).toContain('CREATE INDEX IF NOT EXISTS idx_users_must_change_password');
  });

  it('creates the teams table and the FK-backed columns used by current writes', () => {
    expect(TEAMS_TABLE_BOOTSTRAP_SQL.join('\n')).toContain('CREATE TABLE IF NOT EXISTS teams');

    const playersSql = PLAYERS_TABLE_BOOTSTRAP_SQL.join('\n');
    expect(playersSql).toContain('ALTER TABLE players ADD COLUMN IF NOT EXISTS team_id INTEGER;');
    expect(playersSql).toContain('CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);');

    const matchesSql = MATCHES_TABLE_BOOTSTRAP_SQL.join('\n');
    expect(matchesSql).toContain('ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_id INTEGER;');
    expect(matchesSql).toContain('ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_team_id INTEGER;');
  });
});
