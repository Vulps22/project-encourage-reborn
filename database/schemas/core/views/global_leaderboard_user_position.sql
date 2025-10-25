CREATE OR REPLACE VIEW "global_leaderboard_user_position" AS 
SELECT 
  "u"."id" AS "id",
  "u"."username" AS "username",
  (
    SELECT COUNT(*)
    FROM "user_questions" "ud"
    WHERE "ud"."user_id" = "u"."id"
      AND "ud"."type" = 'dare'
      AND "ud"."done_count" >= 1
      AND "ud"."datetime_created" >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
  ) AS "dares_done",
  (
    SELECT COUNT(*)
    FROM "user_questions" "ut"
    WHERE "ut"."user_id" = "u"."id"
      AND "ut"."type" = 'truth'
      AND "ut"."done_count" >= 1
      AND "ut"."datetime_created" >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
  ) AS "truths_done",
  "u"."global_level" AS "global_level",
  "u"."global_level_xp" AS "global_level_xp",
  (
    (
      SELECT COUNT(*)
      FROM "users" "u2"
      WHERE ("u2"."global_level" > "u"."global_level")
         OR ("u2"."global_level" = "u"."global_level" AND "u2"."global_level_xp" > "u"."global_level_xp")
    ) + 1
  ) AS "position"
FROM "users" "u";
