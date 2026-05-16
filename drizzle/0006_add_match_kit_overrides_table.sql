CREATE TABLE IF NOT EXISTS match_kit_overrides (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  kit_color VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, team_name)
);
