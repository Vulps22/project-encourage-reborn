CREATE TRIGGER IF NOT EXISTS `trg_finalize_user_question` BEFORE UPDATE ON `user_questions` FOR EACH ROW 
BEGIN
  IF NEW.finalResult IS NULL THEN
    -- Mark as done
    IF NEW.doneCount >= 2 THEN
      SET NEW.finalResult = 'done';
      SET NEW.finalised_datetime = NOW();
    END IF;

    -- Mark as failed
    IF NEW.failedCount >= 2 THEN
      SET NEW.finalResult = 'failed';
      SET NEW.finalised_datetime = NOW();
    END IF;

    -- Mark as skipped
    IF NEW.skipped = 1 THEN
      SET NEW.finalResult = 'skipped';
      SET NEW.finalised_datetime = NOW();
    END IF;
  END IF;
END;
