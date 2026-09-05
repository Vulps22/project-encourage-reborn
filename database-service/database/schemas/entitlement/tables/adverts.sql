
CREATE TABLE IF NOT EXISTS "adverts" (
  "serverId" BIGINT NOT NULL,
  "messageId" BIGINT NOT NULL,
  "advert" TEXT NOT NULL,
  "updated" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("serverId")
);
 
CREATE UNIQUE INDEX IF NOT EXISTS "id_UNIQUE" ON "adverts"("serverId");

-- Trigger to automatically update updated timestamp
CREATE OR REPLACE FUNCTION update_adverts_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_adverts_updated ON "adverts";
CREATE TRIGGER trg_adverts_updated
BEFORE UPDATE ON "adverts"
FOR EACH ROW
EXECUTE FUNCTION update_adverts_updated();

COMMENT ON TABLE "adverts" IS 'Stores server advertisements posted to the official support server';
COMMENT ON COLUMN "adverts"."serverId" IS 'Discord server ID of the advertising server';
COMMENT ON COLUMN "adverts"."messageId" IS 'Discord message ID of the posted advertisement in the support server';
COMMENT ON COLUMN "adverts"."updated" IS 'When the advert was last updated (auto-maintained by trigger)';
COMMENT ON COLUMN "adverts"."advert" IS 'Brief description of the server provided by user';

-- bot_user privileges
GRANT USAGE ON SCHEMA "entitlement" TO bot_user;
GRANT SELECT, INSERT, UPDATE ON "entitlement"."adverts" TO bot_user;
