# Playtest Readiness Plan
Target: bot live before midnight Friday (start of Saturday 5 April 2026)

---

## Thursday night

- [ ] Add bot service to `docker-compose.yml` — currently only has the `db` service. Needs:
  - Image: `vulps23/project-encourage:latest`
  - `env_file: .env`
  - `depends_on: db`
  - `restart: unless-stopped`
  - No `dns:` override (Contabo blocks outbound UDP 53 — must inherit host DNS)
  - Restrict postgres port to `127.0.0.1:${DB_PORT:-5432}:5432` (not exposed to 0.0.0.0)
- [ ] Commit and merge to main
- [ ] Set `RELEASES_ENABLED=true` in GitHub repo variables
- [ ] Trigger `begin_release` workflow manually (hotfix path) to kick off build → rollout → deploy
- [ ] Monitor pipeline — expected: Docker image built and pushed, deployed to VPS (~15–30 min)
- [ ] SSH into VPS, confirm PostgreSQL container is healthy (`docker compose ps`)
- [ ] Run `npm run db:install` on VPS (first-time schema setup — creates all tables, triggers, seed data)
- [ ] Run `npm run db:migrate` on VPS (migrates production MySQL data into PostgreSQL)
- [ ] Confirm bot is online in Discord (`docker compose logs -f bot`)

---

## Friday night

- [ ] Full smoke test: `/truth`, `/dare`, `/random`, `/create`, `/report`, done/failed/skip buttons
- [ ] Verify moderation queue receives a test report and action/clear buttons work
- [ ] Confirm top.gg webhook receives votes and skip is granted
- [ ] Fix any issues surfaced by smoke test, hotfix-deploy if needed
- [ ] Get the playtest bot invite link ready
- [ ] Schedule / prepare the announcement post to go out to all servers at the playtest start time

---

## Day off recommendation

**No day off needed** — provided the pipeline runs cleanly Thursday night, Friday evening is enough for smoke testing and fixing minor issues.

Take Friday off only if Thursday night surfaces a significant problem (pipeline failure, VPS setup issue, data migration errors) that you don't have time to debug before bed. Keep Friday evening fully free regardless.

---

## Not required for playtest
- Automated PostgreSQL backup cron (Phase C — post-migration only)
- VPS docker-compose cleanup of old MySQL stack
