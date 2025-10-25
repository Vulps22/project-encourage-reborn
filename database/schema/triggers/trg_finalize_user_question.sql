CREATE TRIGGER IF NOT EXISTS `trg_finalize_user_question` BEFORE UPDATE ON `user_questions` FOR EACH ROW 
BEGIN
  IF NEW.final_result IS NULL THEN
    -- Mark as done
    IF NEW.done_count >= 2 THEN
      SET NEW.final_result = 'done';
      SET NEW.finalised_datetime = NOW();
    END IF;

    -- Mark as failed
    IF NEW.failed_count >= 2 THEN
      SET NEW.final_result = 'failed';
      SET NEW.finalised_datetime = NOW();
    END IF;

    -- Mark as skipped
    IF NEW.skipped = 1 THEN
      SET NEW.final_result = 'skipped';
      SET NEW.finalised_datetime = NOW();
    END IF;
  END IF;
END;
