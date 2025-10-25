CREATE OR REPLACE VIEW "server_leaderboard_top10" AS 
WITH "RankedUsers" AS (
  SELECT 
    "su"."server_id" AS "server_id",
    "su"."user_id" AS "id",
    "u"."username" AS "username",
    "su"."server_level" AS "global_level",
    "su"."server_level_xp" AS "global_level_xp",
    ROW_NUMBER() OVER (PARTITION BY "su"."server_id" ORDER BY "su"."server_level" DESC, "su"."server_level_xp" DESC) AS "position"
  FROM "server_users" "su"
  JOIN "users" "u" ON "u"."id" = "su"."user_id"
),
"QuestionCounts" AS (
  SELECT 
    "uq"."user_id" AS "user_id",
    "uq"."server_id" AS "server_id",
    SUM(CASE WHEN ("uq"."type" = 'dare' AND "uq"."done_count" >= 2) THEN 1 ELSE 0 END) AS "dares_done",
    SUM(CASE WHEN ("uq"."type" = 'truth' AND "uq"."done_count" >= 2) THEN 1 ELSE 0 END) AS "truths_done"
  FROM "user_questions" "uq"
  WHERE "uq"."datetime_created" >= (CURRENT_TIMESTAMP - INTERVAL '90 days')
  GROUP BY "uq"."user_id", "uq"."server_id"
)
SELECT 
  "ru"."server_id" AS "server_id",
  "ru"."id" AS "id",
  "ru"."username" AS "username",
  COALESCE("qc"."dares_done", 0) AS "dares_done",
  COALESCE("qc"."truths_done", 0) AS "truths_done",
  "ru"."global_level" AS "global_level",
  "ru"."global_level_xp" AS "global_level_xp",
  "ru"."position" AS "position"
FROM "RankedUsers" "ru"
LEFT JOIN "QuestionCounts" "qc" ON ("ru"."id" = "qc"."user_id" AND "ru"."server_id" = "qc"."server_id")
WHERE "ru"."position" <= 10
ORDER BY "ru"."position";
