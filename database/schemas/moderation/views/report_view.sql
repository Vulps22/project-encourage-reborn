DROP VIEW IF EXISTS "moderation"."report_view";

CREATE VIEW "moderation"."report_view" AS
SELECT
    -- Report core fields
    r."id",                       -- Unique report ID
    r."type",                     -- Type of report (question, server, user)
    r."reason",                   -- Reporter-provided reason
    r."content",                  -- Snapshot of the reported content
    r."status",                   -- Current moderation status
    r."ban_reason",               -- Moderator-provided ban reason, if actioned
    r."message_id",               -- Discord message ID of the log post
    r."created_at",               -- When the report was created
    r."updated_at",               -- When the report was last updated

    -- Parties
    r."sender_id",                -- Discord user ID of the reporter
    r."offender_id",              -- ID of the reported entity (question ID or server ID)
    r."moderator_id",             -- Discord user ID of the moderator who actioned, if any
    r."server_id",                -- Discord server ID where the report was made

    -- Reporter info
    su."username"                 AS "sender_username",      -- Reporter's Discord username
    su."is_banned"                AS "sender_is_banned",     -- Whether reporter is banned
    su."global_level"             AS "sender_level",         -- Reporter's global level

    -- Question fields (null for non-question reports)
    q."id"                        AS "question_id",          -- Question ID
    q."question"                  AS "question_text",        -- Full question text
    q."type"                      AS "question_type",        -- truth or dare
    q."is_approved"               AS "question_is_approved", -- Whether question was approved
    q."is_banned"                 AS "question_is_banned",   -- Whether question is already banned
    q."user_id"                   AS "question_creator_id",  -- Discord user ID of question creator

    -- Offending user info (question creator for question reports, user ID for user reports)
    ou."id"                       AS "offender_user_id",     -- Offending user's Discord ID
    ou."username"                 AS "offender_username",    -- Offending user's Discord username
    ou."is_banned"                AS "offender_is_banned",   -- Whether offender is already banned
    ou."ban_reason"               AS "offender_ban_reason",  -- Existing ban reason if already banned
    ou."banned_questions"         AS "offender_banned_questions" -- Number of questions previously banned

FROM "moderation"."reports" r

-- Join question data for question-type reports
LEFT JOIN "question"."questions" q
    ON r."type" = 'question'
    AND r."offender_id" = q."id"

-- Join reporter user data
LEFT JOIN "user"."users" su
    ON su."id" = r."sender_id"

-- Join offending user: question creator for question reports, direct user ID for user reports
LEFT JOIN "user"."users" ou
    ON ou."id" = CASE
        WHEN r."type" = 'question' THEN q."user_id"
        WHEN r."type" = 'user'     THEN r."offender_id"
        ELSE NULL
    END;
