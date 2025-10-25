CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `global_leaderboard_top10` AS 
with `RankedUsers` as (
  select 
    `u`.`id` AS `id`,
    `u`.`username` AS `username`,
    `u`.`global_level` AS `global_level`,
    `u`.`global_level_xp` AS `global_level_xp`,
    row_number() OVER (ORDER BY `u`.`global_level` desc, `u`.`global_level_xp` desc) AS `position` 
  from `users` `u`
), 
`QuestionCounts` as (
  select 
    `uq`.`user_id` AS `user_id`,
    sum((case when ((`uq`.`type` = 'dare') and (`uq`.`done_count` >= 2)) then 1 else 0 end)) AS `dares_done`,
    sum((case when ((`uq`.`type` = 'truth') and (`uq`.`done_count` >= 2)) then 1 else 0 end)) AS `truths_done` 
  from `user_questions` `uq` 
  where (`uq`.`datetime_created` >= (now() - interval 30 day)) 
  group by `uq`.`user_id`
) 
select 
  `ru`.`id` AS `id`,
  `ru`.`username` AS `username`,
  coalesce(`qc`.`dares_done`, 0) AS `dares_done`,
  coalesce(`qc`.`truths_done`, 0) AS `truths_done`,
  `ru`.`global_level` AS `global_level`,
  `ru`.`global_level_xp` AS `global_level_xp`,
  `ru`.`position` AS `position` 
from (`RankedUsers` `ru` left join `QuestionCounts` `qc` on ((`ru`.`id` = `qc`.`user_id`))) 
where (`ru`.`position` <= 10) 
order by (`qc`.`truths_done` + `qc`.`dares_done`);
