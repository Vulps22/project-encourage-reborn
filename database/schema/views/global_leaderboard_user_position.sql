CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `global_leaderboard_user_position` AS 
select 
  `u`.`id` AS `id`,
  `u`.`username` AS `username`,
  (select count(0) from `user_questions` `ud` where ((`ud`.`user_id` = `u`.`id`) and (`ud`.`type` = 'dare') and (`ud`.`done_count` >= 1) and (`ud`.`datetime_created` >= (now() - interval 30 day)))) AS `dares_done`,
  (select count(0) from `user_questions` `ut` where ((`ut`.`user_id` = `u`.`id`) and (`ut`.`type` = 'truth') and (`ut`.`done_count` >= 1) and (`ut`.`datetime_created` >= (now() - interval 30 day)))) AS `truths_done`,
  `u`.`global_level` AS `global_level`,
  `u`.`global_level_xp` AS `global_level_xp`,
  ((select count(0) from `users` `u2` where ((`u2`.`global_level` > `u`.`global_level`) or ((`u2`.`global_level` = `u`.`global_level`) and (`u2`.`global_level_xp` > `u`.`global_level_xp`)))) + 1) AS `position` 
from `users` `u`;
