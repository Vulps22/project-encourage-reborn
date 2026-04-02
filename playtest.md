# Playtest Readiness Plan
Target: playtest bot live before midnight Friday (start of Saturday 5 April 2026)
The current production bot remains running and untouched throughout.

---

## Thursday night

- [ ] Create a new Discord application for the playtest bot at discord.com/developers
  - Note its token and client ID — these go in the playtest `.env`
- [ ] Add bot service to `docker-compose.yml` in this repo — currently only has the `db` service. Needs:
  - Image: `vulps23/project-encourage:playtest` (distinct tag from `:latest`)
  - `env_file: .env`
  - `depends_on: db`
  - `restart: unless-stopped`
  - No `dns:` override (Contabo blocks outbound UDP 53 — must inherit host DNS)
  - Restrict postgres port to `127.0.0.1:${DB_PORT:-5432}:5432` (not exposed to 0.0.0.0)
- [ ] Commit and push `docker-compose.yml` to main
- [ ] Manually build and push the Docker image:
  ```
  docker build -t vulps23/project-encourage:playtest .
  docker push vulps23/project-encourage:playtest
  ```
- [ ] SSH into VPS
- [ ] Create `/opt/discord-bots/project-encourage-playtest/`
- [ ] Copy `docker-compose.yml` into that directory
- [ ] Create `.env` in that directory — same as production `.env` except:
  - `DISCORD_TOKEN` = playtest bot token
  - `CLIENT_ID` = playtest bot client ID
  - `DB_PORT` = a free port (e.g. `5433`) to avoid conflicting with the production PostgreSQL
- [ ] Start the database: `docker compose up -d db`
- [ ] Confirm PostgreSQL is healthy: `docker compose ps`
- [ ] Run `npm run db:install` to create the schema (tables, triggers, seed data)
- [ ] Run `npm run db:migrate` to bring in production MySQL data
- [ ] Start the bot: `docker compose up -d bot`
- [ ] Confirm bot is online: `docker compose logs -f bot`
- [ ] Configure the uptime bot to monitor the playtest bot on the official server:
  - Watch for the playtest bot's online status
  - When online, ping `https://cron.instatus.com/vulps-cf7dvnhecw447y0b`

---

## Friday night

- [ ] Full smoke test: `/truth`, `/dare`, `/random`, `/create`, `/report`, done/failed/skip buttons
- [ ] Verify moderation queue receives a test report and action/clear buttons work
- [ ] Confirm top.gg webhook receives votes and skip is granted
- [ ] Fix any issues — rebuild and push `:playtest` tag, pull on VPS, restart
- [ ] Get the playtest bot invite link ready
- [ ] Schedule / prepare the announcement post to go out to all servers at the playtest start time

---

## Day off recommendation

**No day off needed** — provided the VPS setup goes smoothly Thursday night, Friday evening is enough for smoke testing and fixing minor issues.

Take Friday off only if Thursday night surfaces a significant problem (VPS setup, data migration errors, bot not connecting) that you don't have time to debug before bed. Keep Friday evening fully free regardless.

---

## Not required for playtest
- CI/CD pipeline (`RELEASES_ENABLED`) — the playtest is a manual build/deploy
- Automated PostgreSQL backup cron (Phase C — post-migration only)
- Any changes to the production bot or its docker-compose
