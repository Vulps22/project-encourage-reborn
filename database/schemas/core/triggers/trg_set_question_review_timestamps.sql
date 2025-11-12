-- Trigger function
CREATE OR REPLACE FUNCTION "trg_set_question_review_timestamps_func"()
RETURNS TRIGGER AS $$
BEGIN
  -- Set approval timestamp
  IF NEW.is_approved = true AND OLD.is_approved = false THEN
    NEW.datetime_approved := CURRENT_TIMESTAMP;
  END IF;

  -- Set ban timestamp
  IF NEW.is_banned = true AND OLD.is_banned = false THEN
    NEW.datetime_banned := CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS "trg_set_question_review_timestamps" ON "questions";
CREATE TRIGGER "trg_set_question_review_timestamps"
  BEFORE UPDATE ON "questions"
  FOR EACH ROW
  EXECUTE FUNCTION "trg_set_question_review_timestamps_func"();
