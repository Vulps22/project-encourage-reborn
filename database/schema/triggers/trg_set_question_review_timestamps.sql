CREATE TRIGGER IF NOT EXISTS `trg_set_question_review_timestamps` BEFORE UPDATE ON `questions` FOR EACH ROW 
BEGIN
  -- Set approval timestamp
  IF NEW.is_approved = 1 AND OLD.is_approved = 0 THEN
    SET NEW.datetime_approved = NOW();
  END IF;

  -- Set ban timestamp
  IF NEW.is_banned = 1 AND OLD.is_banned = 0 THEN
    SET NEW.datetime_banned = NOW();
  END IF;
END;
