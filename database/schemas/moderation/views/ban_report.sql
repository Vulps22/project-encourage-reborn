CREATE OR REPLACE VIEW "ban_report" AS 
SELECT 
  "q"."user_id" AS "user_id",
  SUM(CASE WHEN ("q"."is_banned" = TRUE AND "q"."type" = 'truth') THEN 1 ELSE 0 END) AS "banned_truths_count",
  SUM(CASE WHEN ("q"."is_banned" = TRUE AND "q"."type" = 'dare') THEN 1 ELSE 0 END) AS "banned_dares_count",
  SUM(CASE WHEN "q"."is_banned" = TRUE THEN 1 ELSE 0 END) AS "total_bans_count"
FROM "core"."questions" "q"
WHERE "q"."is_banned" = TRUE
GROUP BY "q"."user_id"
ORDER BY "total_bans_count" DESC;
