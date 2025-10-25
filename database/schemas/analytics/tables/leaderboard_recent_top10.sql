
CREATE TABLE IF NOT EXISTS "leaderboard_recent_top10" (
  "userId" BIGINT NOT NULL,
  "username" VARCHAR(64) DEFAULT NULL,
  "truths_done" INTEGER DEFAULT 0,
  "dares_done" INTEGER DEFAULT 0,
  "total_done" INTEGER GENERATED ALWAYS AS ("truths_done" + "dares_done") STORED,
  PRIMARY KEY ("userId")
);
 
COMMENT ON TABLE "leaderboard_recent_top10" IS 'TODO: Needs cleanup - holds current top 10 users (maybe?)';
COMMENT ON COLUMN "leaderboard_recent_top10"."userId" IS 'Discord user ID';
COMMENT ON COLUMN "leaderboard_recent_top10"."truths_done" IS 'Number of truths completed';
COMMENT ON COLUMN "leaderboard_recent_top10"."dares_done" IS 'Number of dares completed';
COMMENT ON COLUMN "leaderboard_recent_top10"."total_done" IS 'Total number of questions completed';
