
CREATE TABLE IF NOT EXISTS "server"."server_level_roles" ("server_id" BIGINT NOT NULL,
  "role_id" BIGINT NOT NULL,
  "level" INTEGER NOT NULL,
  PRIMARY KEY ("server_id", "role_id"),
  CONSTRAINT "fk_server_level_roles_server_id" FOREIGN KEY ("server_id") REFERENCES "server"."servers" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
 
CREATE INDEX IF NOT EXISTS "fk_server_level_roles_server_id" ON "server"."server_level_roles"("server_id");

COMMENT ON TABLE "server"."server_level_roles" IS 'Defines role rewards for reaching specific server levels';
COMMENT ON COLUMN "server"."server_level_roles"."server_id" IS 'Discord server ID this role reward belongs to';
COMMENT ON COLUMN "server"."server_level_roles"."role_id" IS 'Discord role ID to assign when the level is reached';
COMMENT ON COLUMN "server"."server_level_roles"."level" IS 'Server level required to earn this role';
