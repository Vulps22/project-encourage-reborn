CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `server_leaderboard_top10` AS 
with `RankedUsers` as (
  select 
    `su`.`server_id` AS `server_id`,
    `su`.`user_id` AS `id`,
    `u`.`username` AS `username`,
    `su`.`server_level` AS `global_level`,
    `su`.`server_level_xp` AS `global_level_xp`,
    row_number() OVER (PARTITION BY `su`.`server_id` ORDER BY `su`.`server_level` desc, `su`.`server_level_xp` desc) AS `position` 
  from (`server_users` `su` join `users` `u` on ((`u`.`id` = `su`.`user_id`)))
), 
`QuestionCounts` as (
  select 
    `uq`.`user_id` AS `user_id`,
    `uq`.`server_id` AS `server_id`,
    sum((case when ((`uq`.`type` = 'dare') and (`uq`.`done_count` >= 2)) then 1 else 0 end)) AS `dares_done`,
    sum((case when ((`uq`.`type` = 'truth') and (`uq`.`done_count` >= 2)) then 1 else 0 end)) AS `truths_done` 
  from `user_questions` `uq` 
  where (`uq`.`datetime_created` >= (now() - interval 90 day)) 
  group by `uq`.`user_id`, `uq`.`server_id`
) 
select 
  `ru`.`server_id` AS `server_id`,
  `ru`.`id` AS `id`,
  `ru`.`username` AS `username`,
  coalesce(`qc`.`dares_done`, 0) AS `dares_done`,
  coalesce(`qc`.`truths_done`, 0) AS `truths_done`,
  `ru`.`global_level` AS `global_level`,
  `ru`.`global_level_xp` AS `global_level_xp`,
  `ru`.`position` AS `position` 
from (`RankedUsers` `ru` left join `QuestionCounts` `qc` on (((`ru`.`id` = `qc`.`user_id`) and (`ru`.`server_id` = `qc`.`server_id`)))) 
where (`ru`.`position` <= 10) 
order by `ru`.`position`;
