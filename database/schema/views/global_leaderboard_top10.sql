CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `global_leaderboard_top10` AS 
with `RankedUsers` as (
  select 
    `u`.`id` AS `id`,
    `u`.`username` AS `username`,
    `u`.`globalLevel` AS `globalLevel`,
    `u`.`globalLevelXp` AS `globalLevelXp`,
    row_number() OVER (ORDER BY `u`.`globalLevel` desc, `u`.`globalLevelXp` desc) AS `position` 
  from `users` `u`
), 
`QuestionCounts` as (
  select 
    `uq`.`userId` AS `userId`,
    sum((case when ((`uq`.`type` = 'dare') and (`uq`.`doneCount` >= 2)) then 1 else 0 end)) AS `dares_done`,
    sum((case when ((`uq`.`type` = 'truth') and (`uq`.`doneCount` >= 2)) then 1 else 0 end)) AS `truths_done` 
  from `user_questions` `uq` 
  where (`uq`.`datetime_created` >= (now() - interval 30 day)) 
  group by `uq`.`userId`
) 
select 
  `ru`.`id` AS `id`,
  `ru`.`username` AS `username`,
  coalesce(`qc`.`dares_done`, 0) AS `dares_done`,
  coalesce(`qc`.`truths_done`, 0) AS `truths_done`,
  `ru`.`globalLevel` AS `globalLevel`,
  `ru`.`globalLevelXp` AS `globalLevelXp`,
  `ru`.`position` AS `position` 
from (`RankedUsers` `ru` left join `QuestionCounts` `qc` on ((`ru`.`id` = `qc`.`userId`))) 
where (`ru`.`position` <= 10) 
order by (`qc`.`truths_done` + `qc`.`dares_done`);
