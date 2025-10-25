CREATE OR REPLACE VIEW "ban_report" AS 
SELECT 
  "q"."creator" AS "creator",
  SUM(CASE WHEN ("q"."is_banned" = TRUE AND "q"."type" = 'truth') THEN 1 ELSE 0 END) AS "bannedTruthsCount",
  SUM(CASE WHEN ("q"."is_banned" = TRUE AND "q"."type" = 'dare') THEN 1 ELSE 0 END) AS "bannedDaresCount",
  SUM(CASE WHEN "q"."is_banned" = TRUE THEN 1 ELSE 0 END) AS "totalBansCount"
FROM "questions" "q"
WHERE "q"."is_banned" = TRUE
GROUP BY "q"."creator"
ORDER BY "totalBansCount" DESC;
