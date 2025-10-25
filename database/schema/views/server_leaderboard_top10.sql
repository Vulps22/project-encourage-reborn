CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `server_leaderboard_top10` AS 
with `RankedUsers` as (
  select 
    `su`.`server_id` AS `server_id`,
    `su`.`user_id` AS `id`,
    `u`.`username` AS `username`,
    `su`.`server_level` AS `globalLevel`,
    `su`.`server_level_xp` AS `globalLevelXp`,
    row_number() OVER (PARTITION BY `su`.`server_id` ORDER BY `su`.`server_level` desc, `su`.`server_level_xp` desc) AS `position` 
  from (`server_users` `su` join `users` `u` on ((`u`.`id` = `su`.`user_id`)))
), 
`QuestionCounts` as (
  select 
    `uq`.`userId` AS `userId`,
    `uq`.`serverId` AS `serverId`,
    sum((case when ((`uq`.`type` = 'dare') and (`uq`.`doneCount` >= 2)) then 1 else 0 end)) AS `dares_done`,
    sum((case when ((`uq`.`type` = 'truth') and (`uq`.`doneCount` >= 2)) then 1 else 0 end)) AS `truths_done` 
  from `user_questions` `uq` 
  where (`uq`.`datetime_created` >= (now() - interval 90 day)) 
  group by `uq`.`userId`, `uq`.`serverId`
) 
select 
  `ru`.`server_id` AS `server_id`,
  `ru`.`id` AS `id`,
  `ru`.`username` AS `username`,
  coalesce(`qc`.`dares_done`, 0) AS `dares_done`,
  coalesce(`qc`.`truths_done`, 0) AS `truths_done`,
  `ru`.`globalLevel` AS `globalLevel`,
  `ru`.`globalLevelXp` AS `globalLevelXp`,
  `ru`.`position` AS `position` 
from (`RankedUsers` `ru` left join `QuestionCounts` `qc` on (((`ru`.`id` = `qc`.`userId`) and (`ru`.`server_id` = `qc`.`serverId`)))) 
where (`ru`.`position` <= 10) 
order by `ru`.`position`;
