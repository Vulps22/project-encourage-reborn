/**
 * #141 - Grant bot_user access to the entitlement schema.
 *
 * 20260807_162_grant_bot_user_permissions predates the entitlement schema landing on
 * existing databases, so bot_user was never granted anything on it - fresh installs
 * get these grants from schemas/entitlement/, existing databases get them here.
 *
 * DELETE on entitlement.entitlements is new: DS releases an entitlement claim when
 * fulfilling it fails, so a redelivery can claim it again.
 *
 * @param {import('pg').PoolClient} client
 */
async function apply(client) {
  await client.query(`
    GRANT USAGE ON SCHEMA "entitlement" TO bot_user;
    GRANT SELECT, INSERT, UPDATE ON "entitlement"."adverts" TO bot_user;
    GRANT SELECT, INSERT, UPDATE ON "entitlement"."audit" TO bot_user;
    GRANT USAGE, SELECT ON SEQUENCE "entitlement"."audit_id_seq" TO bot_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "entitlement"."entitlements" TO bot_user;
    GRANT SELECT ON "entitlement"."purchasables" TO bot_user;
    GRANT USAGE, SELECT ON SEQUENCE "entitlement"."purchasables_id_seq" TO bot_user;
  `);
}

/** @param {import('pg').PoolClient} client */
async function revert(client) {
  await client.query(`
    REVOKE ALL ON "entitlement"."adverts" FROM bot_user;
    REVOKE ALL ON "entitlement"."audit" FROM bot_user;
    REVOKE ALL ON SEQUENCE "entitlement"."audit_id_seq" FROM bot_user;
    REVOKE ALL ON "entitlement"."entitlements" FROM bot_user;
    REVOKE ALL ON "entitlement"."purchasables" FROM bot_user;
    REVOKE ALL ON SEQUENCE "entitlement"."purchasables_id_seq" FROM bot_user;
    REVOKE USAGE ON SCHEMA "entitlement" FROM bot_user;
  `);
}

module.exports = { apply, revert };
