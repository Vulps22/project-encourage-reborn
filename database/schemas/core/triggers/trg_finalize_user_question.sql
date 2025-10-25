-- Trigger function
CREATE OR REPLACE FUNCTION "trg_finalize_user_question_func"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.final_result IS NULL THEN
    -- Mark as done
    IF NEW.done_count >= 2 THEN
      NEW.final_result := 'done';
      NEW.finalised_datetime := CURRENT_TIMESTAMP;
    END IF;

    -- Mark as failed
    IF NEW.failed_count >= 2 THEN
      NEW.final_result := 'failed';
      NEW.finalised_datetime := CURRENT_TIMESTAMP;
    END IF;

    -- Mark as skipped
    IF NEW.skipped = 1 THEN
      NEW.final_result := 'skipped';
      NEW.finalised_datetime := CURRENT_TIMESTAMP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS "trg_finalize_user_question" ON "user_questions";
CREATE TRIGGER "trg_finalize_user_question"
  BEFORE UPDATE ON "user_questions"
  FOR EACH ROW
  EXECUTE FUNCTION "trg_finalize_user_question_func"();
