# Applied Migrations

This directory contains migration files that have been applied to production.

## Purpose

When you run `npm run db:rollout` (without an issue number), migration files are automatically moved from `migrations/` to this `applied/` directory after successful deployment.

## Contents

This directory should contain:
- `#<issue>_rollout.sql` files that have been applied to production
- `#<issue>_rollback.sql` files for reverting those migrations if needed

## Rollback Process

If you need to rollback a production migration:
```bash
npm run db:rollback 23
```

This will:
1. Execute the rollback SQL from `#23_rollback.sql`
2. Remove the migration record from the database
3. Move both files back to `migrations/` for fixing and redeployment

## Note

Files in this directory represent the migration history of your production database. Do not manually move or delete files from this directory - let the scripts manage the file locations.
