CREATE TABLE IF NOT EXISTS "match_player_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "match_player_goals_match_player_unique" UNIQUE("match_id","player_id")
);

