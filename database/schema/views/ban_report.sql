CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `ban report` AS 
select 
  `q`.`creator` AS `creator`,
  sum((case when ((`q`.`is_banned` = 1) and (`q`.`type` = 'truth')) then 1 else 0 end)) AS `bannedTruthsCount`,
  sum((case when ((`q`.`is_banned` = 1) and (`q`.`type` = 'dare')) then 1 else 0 end)) AS `bannedDaresCount`,
  sum((case when (`q`.`is_banned` = 1) then 1 else 0 end)) AS `totalBansCount` 
from `questions` `q` 
where (`q`.`is_banned` = 1) 
group by `q`.`creator` 
order by `totalBansCount` desc;
