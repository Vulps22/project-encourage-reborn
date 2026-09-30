/** @param {import('pg').PoolClient} client */
async function apply(client) {
  await client.query(`
    GRANT USAGE ON SCHEMA "challenge" TO bot_user;
    GRANT SELECT, INSERT, UPDATE ON "challenge"."challenges" TO bot_user;
    GRANT USAGE, SELECT ON SEQUENCE "challenge"."challenges_id_seq" TO bot_user;

    GRANT USAGE ON SCHEMA "core" TO bot_user;
    GRANT SELECT ON "core"."config" TO bot_user;
    GRANT SELECT ON "core"."storables" TO bot_user;

    GRANT USAGE ON SCHEMA "moderation" TO bot_user;
    GRANT SELECT, INSERT, UPDATE ON "moderation"."reports" TO bot_user;
    GRANT USAGE, SELECT ON SEQUENCE "moderation"."reports_id_seq" TO bot_user;
    GRANT SELECT ON "moderation"."report_view" TO bot_user;
    GRANT SELECT ON "moderation"."ban_report" TO bot_user;

    GRANT USAGE ON SCHEMA "question" TO bot_user;
    GRANT SELECT, INSERT, UPDATE ON "question"."given_questions" TO bot_user;
    GRANT USAGE, SELECT ON SEQUENCE "question"."given_questions_id_seq" TO bot_user;
    GRANT SELECT, INSERT, UPDATE ON "question"."questions" TO bot_user;
    GRANT USAGE, SELECT ON SEQUENCE "question"."questions_id_seq" TO bot_user;

    GRANT USAGE ON SCHEMA "server" TO bot_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "server"."server_level_roles" TO bot_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "server"."servers" TO bot_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "server"."server_users" TO bot_user;

    GRANT USAGE ON SCHEMA "system" TO bot_user;
    GRANT SELECT ON "system"."config" TO bot_user;

    GRANT USAGE ON SCHEMA "user" TO bot_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "user"."inventory" TO bot_user;
    GRANT USAGE, SELECT ON SEQUENCE "user"."inventory_id_seq" TO bot_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "user"."users" TO bot_user;

    GRANT USAGE ON SCHEMA "vote" TO bot_user;
    GRANT SELECT, INSERT, UPDATE ON "vote"."challenge_votes" TO bot_user;
    GRANT SELECT, INSERT, UPDATE ON "vote"."user_votes" TO bot_user;
  `);
}

/** @param {import('pg').PoolClient} client */
async function revert(client) {
  await client.query(`
    REVOKE ALL ON "challenge"."challenges" FROM bot_user;
    REVOKE ALL ON SEQUENCE "challenge"."challenges_id_seq" FROM bot_user;
    REVOKE USAGE ON SCHEMA "challenge" FROM bot_user;

    REVOKE ALL ON "core"."config" FROM bot_user;
    REVOKE ALL ON "core"."storables" FROM bot_user;
    REVOKE USAGE ON SCHEMA "core" FROM bot_user;

    REVOKE ALL ON "moderation"."reports" FROM bot_user;
    REVOKE ALL ON SEQUENCE "moderation"."reports_id_seq" FROM bot_user;
    REVOKE ALL ON "moderation"."report_view" FROM bot_user;
    REVOKE ALL ON "moderation"."ban_report" FROM bot_user;
    REVOKE USAGE ON SCHEMA "moderation" FROM bot_user;

    REVOKE ALL ON "question"."given_questions" FROM bot_user;
    REVOKE ALL ON SEQUENCE "question"."given_questions_id_seq" FROM bot_user;
    REVOKE ALL ON "question"."questions" FROM bot_user;
    REVOKE ALL ON SEQUENCE "question"."questions_id_seq" FROM bot_user;
    REVOKE USAGE ON SCHEMA "question" FROM bot_user;

    REVOKE ALL ON "server"."server_level_roles" FROM bot_user;
    REVOKE ALL ON "server"."servers" FROM bot_user;
    REVOKE ALL ON "server"."server_users" FROM bot_user;
    REVOKE USAGE ON SCHEMA "server" FROM bot_user;

    REVOKE ALL ON "system"."config" FROM bot_user;
    REVOKE USAGE ON SCHEMA "system" FROM bot_user;

    REVOKE ALL ON "user"."inventory" FROM bot_user;
    REVOKE ALL ON SEQUENCE "user"."inventory_id_seq" FROM bot_user;
    REVOKE ALL ON "user"."users" FROM bot_user;
    REVOKE USAGE ON SCHEMA "user" FROM bot_user;

    REVOKE ALL ON "vote"."challenge_votes" FROM bot_user;
    REVOKE ALL ON "vote"."user_votes" FROM bot_user;
    REVOKE USAGE ON SCHEMA "vote" FROM bot_user;
  `);
}

module.exports = { apply, revert };
