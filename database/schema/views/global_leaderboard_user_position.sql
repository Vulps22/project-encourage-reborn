CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `global_leaderboard_user_position` AS 
select 
  `u`.`id` AS `id`,
  `u`.`username` AS `username`,
  (select count(0) from `user_questions` `ud` where ((`ud`.`userId` = `u`.`id`) and (`ud`.`type` = 'dare') and (`ud`.`doneCount` >= 1) and (`ud`.`datetime_created` >= (now() - interval 30 day)))) AS `dares_done`,
  (select count(0) from `user_questions` `ut` where ((`ut`.`userId` = `u`.`id`) and (`ut`.`type` = 'truth') and (`ut`.`doneCount` >= 1) and (`ut`.`datetime_created` >= (now() - interval 30 day)))) AS `truths_done`,
  `u`.`globalLevel` AS `globalLevel`,
  `u`.`globalLevelXp` AS `globalLevelXp`,
  ((select count(0) from `users` `u2` where ((`u2`.`globalLevel` > `u`.`globalLevel`) or ((`u2`.`globalLevel` = `u`.`globalLevel`) and (`u2`.`globalLevelXp` > `u`.`globalLevelXp`)))) + 1) AS `position` 
from `users` `u`;
