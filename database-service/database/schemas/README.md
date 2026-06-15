# Database schemas directory
This directory contains the current state of all database tables.
Each file represents one table and serves as the single source of truth.

## Structure
- Files in root: Tables in the `public` schema
- Subdirectories: Custom PostgreSQL schemas (e.g., `core/`, `analytics/`)
  - Tables in subdirectories will be created in their respective schema

## Example
- `schemas/users.sql` → `public.users`
- `schemas/core/users.sql` → `core.users`
- `schemas/analytics/events.sql` → `analytics.events`
