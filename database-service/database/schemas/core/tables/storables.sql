CREATE TABLE IF NOT EXISTS "core"."storables" (
  "id" VARCHAR(50) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  PRIMARY KEY ("id")
);

COMMENT ON TABLE "core"."storables" IS 'Registry of items that can be stored in a user inventory';
COMMENT ON COLUMN "core"."storables"."id" IS 'Slug identifier for the storable (e.g. ''skip'')';
COMMENT ON COLUMN "core"."storables"."name" IS 'Human-readable display name';

INSERT INTO "core"."storables" ("id", "name") VALUES ('skip', 'Skip')
ON CONFLICT ("id") DO NOTHING;

-- bot_user privileges
GRANT SELECT ON "core"."storables" TO bot_user;
