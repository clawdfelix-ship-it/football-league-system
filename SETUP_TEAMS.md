-- Run this SQL to create teams table with kit colors
-- Copy this to your database admin tool or run via psql

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  home_kit_color VARCHAR(20) DEFAULT 'white',
  away_kit_color VARCHAR(20) DEFAULT 'black'
);

-- Insert initial teams
INSERT INTO teams (name, home_kit_color, away_kit_color) VALUES
  ('NOMURA', 'red', 'white'),
  ('BBVA', 'blue', 'white'),
  ('LGT', 'purple', 'white'),
  ('CACIB', 'green', 'white'),
  ('CITI', 'blue', 'white'),
  ('SCB', 'red', 'white'),
  ('UBS', 'yellow', 'black'),
  ('HSBC', 'red', 'white'),
  ('KPMG', 'indigo', 'white')
ON CONFLICT (name) DO UPDATE SET
  home_kit_color = EXCLUDED.home_kit_color,
  away_kit_color = EXCLUDED.away_kit_color;
