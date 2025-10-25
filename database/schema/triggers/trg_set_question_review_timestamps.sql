CREATE TRIGGER IF NOT EXISTS `trg_set_question_review_timestamps` BEFORE UPDATE ON `questions` FOR EACH ROW 
BEGIN
  -- Set approval timestamp
  IF NEW.isApproved = 1 AND OLD.isApproved = 0 THEN
    SET NEW.datetime_approved = NOW();
  END IF;

  -- Set ban timestamp
  IF NEW.isBanned = 1 AND OLD.isBanned = 0 THEN
    SET NEW.datetime_banned = NOW();
  END IF;
END;
