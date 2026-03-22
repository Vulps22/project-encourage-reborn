CREATE OR REPLACE VIEW "global_leaderboard_top10" AS
WITH "RankedUsers" AS (
  SELECT
    "u"."id" AS "id",
    "u"."username" AS "username",
    "u"."global_level" AS "global_level",
    "u"."global_level_xp" AS "global_level_xp",
    ROW_NUMBER() OVER (ORDER BY "u"."global_level" DESC, "u"."global_level_xp" DESC) AS "position"
  FROM "user"."users" "u"
),
"QuestionCounts" AS (
  SELECT
    "c"."user_id" AS "user_id",
    SUM(CASE WHEN ("c"."type" = 'dare' AND "cv"."final_result" = 'done') THEN 1 ELSE 0 END) AS "dares_done",
    SUM(CASE WHEN ("c"."type" = 'truth' AND "cv"."final_result" = 'done') THEN 1 ELSE 0 END) AS "truths_done"
  FROM "challenge"."challenges" "c"
  JOIN "vote"."challenge_votes" "cv" ON "cv"."challenge_id" = "c"."id"
  WHERE "c"."datetime_created" >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
  GROUP BY "c"."user_id"
)
SELECT
  "ru"."id" AS "id",
  "ru"."username" AS "username",
  COALESCE("qc"."dares_done", 0) AS "dares_done",
  COALESCE("qc"."truths_done", 0) AS "truths_done",
  "ru"."global_level" AS "global_level",
  "ru"."global_level_xp" AS "global_level_xp",
  "ru"."position" AS "position"
FROM "RankedUsers" "ru"
LEFT JOIN "QuestionCounts" "qc" ON ("ru"."id" = "qc"."user_id")
WHERE "ru"."position" <= 10
ORDER BY ("qc"."truths_done" + "qc"."dares_done");
