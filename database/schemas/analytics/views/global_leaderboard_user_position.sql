CREATE OR REPLACE VIEW "global_leaderboard_user_position" AS
SELECT
  "u"."id" AS "id",
  "u"."username" AS "username",
  (
    SELECT COUNT(*)
    FROM "challenge"."challenges" "cd"
    JOIN "vote"."challenge_votes" "cvd" ON "cvd"."challenge_id" = "cd"."id"
    WHERE "cd"."user_id" = "u"."id"
      AND "cd"."type" = 'dare'
      AND "cvd"."final_result" = 'done'
      AND "cd"."datetime_created" >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
  ) AS "dares_done",
  (
    SELECT COUNT(*)
    FROM "challenge"."challenges" "ct"
    JOIN "vote"."challenge_votes" "cvt" ON "cvt"."challenge_id" = "ct"."id"
    WHERE "ct"."user_id" = "u"."id"
      AND "ct"."type" = 'truth'
      AND "cvt"."final_result" = 'done'
      AND "ct"."datetime_created" >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
  ) AS "truths_done",
  "u"."global_level" AS "global_level",
  "u"."global_level_xp" AS "global_level_xp",
  (
    (
      SELECT COUNT(*)
      FROM "user"."users" "u2"
      WHERE ("u2"."global_level" > "u"."global_level")
         OR ("u2"."global_level" = "u"."global_level" AND "u2"."global_level_xp" > "u"."global_level_xp")
    ) + 1
  ) AS "position"
FROM "user"."users" "u";
