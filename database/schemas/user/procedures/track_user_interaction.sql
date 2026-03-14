-- Stored procedure to track user interactions
-- Ensures user, server, and server_users relationship exist in database
-- Called on every bot interaction to maintain user/server tracking

CREATE OR REPLACE FUNCTION track_user_interaction(
    p_user_id BIGINT,
    p_server_id BIGINT,
    p_server_owner BIGINT
)
RETURNS void AS $$
BEGIN
    -- Insert user if not exists (minimal data, just ID and defaults)
    INSERT INTO "user"."users" ("id")
    VALUES (p_user_id)
    ON CONFLICT ("id") DO NOTHING;

    -- Insert server if not exists (requires name and owner)
    INSERT INTO "server"."servers" ("id", "user_id")
    VALUES (p_server_id, p_server_owner)
    ON CONFLICT ("id") DO NOTHING;

    -- Insert server_users relationship if not exists
    INSERT INTO "server"."server_users" ("user_id", "server_id")
    VALUES (p_user_id, p_server_id)
    ON CONFLICT ("user_id", "server_id") DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION track_user_interaction IS 'Tracks user interaction by ensuring user, server, and user-server relationship exist in database';
