# project-moderator — Build Plan

## What It Is
A standalone Discord bot + Express webhook server that receives events from a primary bot, posts interactive moderation log messages, and handles moderator actions (approve/ban) via Discord UI components.

---

## Architecture

```
Primary Bot  ──POST /question──►  Express Server (auth gated)
                                        │
                                        ▼
                                  QuestionService.createQuestion()
                                        │
                                        ▼
                                  LoggerService.postTo(channel, UniversalMessage)
                                        │
                                        ▼
                                  Discord #question-log (embed + buttons)
                                        │
                            ┌───────────┴───────────┐
                    Approve Button              Ban Button
                            │                       │
                    moderation_approveQuestion  moderation_banQuestion
                    (already exists in          (already exists in
                     _handlers/buttons/)         _handlers/buttons/)
                            │                       │
                    QuestionService.update()  QuestionService.update()
                    LoggerService.update()    LoggerService.delete()
                    Notify primary bot        Notify primary bot
```

---

## Project Structure (current state)

```
src/
├── index.ts                            # TODO — starts bot + Express together
│
├── api/
│   ├── server.ts                       ✅ Express app factory
│   ├── middleware/
│   │   └── auth.ts                     ✅ Bearer token auth
│   └── routes/
│       └── question.ts                 # TODO — POST /question handler
│
├── bot/
│   ├── bot.ts                          ✅ Bot startup (adapt into index.ts)
│   ├── client.ts                       ✅ Discord client singleton
│   │
│   ├── _handlers/                      ✅ File-system routed handlers
│   │   ├── buttons/
│   │   │   ├── moderation/             ✅ approveQuestion, banQuestion, etc.
│   │   │   ├── question/               ✅ done, failed, report, skip
│   │   │   └── setup/                  ✅ (from main bot, keep for adaptability)
│   │   ├── selects/
│   │   │   └── moderation/             ✅ questionBanReasonSelected, etc.
│   │   ├── modals/
│   │   │   └── question/               ✅ reportModal
│   │   └── commands/                   ✅ (kept for adaptability)
│   │
│   ├── config/                         ✅ dev/stage/prod Config + banReasons
│   ├── errors/                         ✅ DMInteractionError, NullChannelError, etc.
│   │
│   ├── events/
│   │   ├── interactionCreate.ts        ✅ Clean version (services stripped)
│   │   ├── guildCreatedEvent.ts        ✅
│   │   └── interactionEvents/          ✅ Button/Modal/Select/Command dispatchers
│   │
│   ├── services/                       ✅ Ported from main bot
│   │   ├── DatabaseService.ts          ✅ PostgreSQL via pg
│   │   ├── QuestionService.ts          ✅ createQuestion, updateQuestion, etc.
│   │   ├── ModerationService.ts        ✅
│   │   ├── ServerService.ts            ✅
│   │   ├── UserService.ts              ✅
│   │   ├── UserTrackingService.ts      ✅
│   │   └── ...others                   ✅
│   │
│   ├── structures/                     ✅ BotInteraction hierarchy
│   ├── types/                          ✅ UniversalMessage, EventHandler, etc.
│   ├── utils/                          ✅ Logger, Handler, Command
│   └── views/                          ✅ Embeds/components (moderation, setup, etc.)
│
├── services/
│   └── LoggerService.ts                ✅ postTo(), update(), delete()
│
└── types/
    └── UniversalMessage.ts             ✅ (duplicate — see note below)
```

---

## Still To Build

| File | What |
|---|---|
| `src/index.ts` | Entry point — runs `startBot()` from bot.ts pattern + `createServer()` from api/server.ts |
| `src/api/routes/question.ts` | `POST /question` → validates body → `QuestionService.createQuestion()` → `LoggerService.postTo()` |
| `src/bot/interface/` | Missing — imported by `QuestionService` and likely other services. Needs `Question` and other DB row interfaces |

---

## Known Issues / Cleanup Needed

| Issue | File | Action |
|---|---|---|
| `interface` folder missing | `QuestionService.ts` imports `'../interface'` | Create `src/bot/interface/` with `Question` type |
| `UniversalMessage` duplicated | Lives at both `src/types/` and `src/bot/types/` | Delete `src/types/UniversalMessage.ts`, canonical is `src/bot/types/` |
| `client.ts` redundant | Bot creates its own client inside `startBot()` | Remove `src/bot/client.ts` or repurpose |
| `services/index.ts` inits DB at import | Eagerly instantiates `DatabaseService` | Acceptable for now; revisit if startup order matters |

---

## npm Dependencies

### Currently in package.json (need to add):
```
pg                  # PostgreSQL client (DatabaseService)
@types/pg           # TypeScript types for pg
jest                # Test runner
ts-jest             # TypeScript preprocessor for jest
@types/jest         # TypeScript types for jest
```

### Config files needed:
- `jest.config.ts`

---

## API Routes

| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | /question | Bearer | `src/api/routes/question.ts` |

### POST /question body
```json
{
  "userId": "123456789",
  "username": "cooluser",
  "question": "Can I post memes?",
  "guildId": "987654321",
  "type": "truth"
}
```

Flow: `POST /question` → validate body → `QuestionService.createQuestion()` → build `UniversalMessage` (embed + Approve/Ban buttons) → `LoggerService.postTo(LOG_CHANNEL_ID, message)`

---

## Interaction Handler Routing

Handlers in `_handlers/` are auto-loaded at startup. The `customId` on buttons/selects/modals must match the collection key:

| customId format | Resolves to |
|---|---|
| `moderation_approveQuestion_id:123` | `_handlers/buttons/moderation/approveQuestion.ts` |
| `moderation_banQuestion_id:123` | `_handlers/buttons/moderation/banQuestion.ts` |
| `moderation_questionBanReasonSelected_id:123` | `_handlers/selects/moderation/questionBanReasonSelected.ts` |

---

## Auth
All incoming webhook requests require:
```
Authorization: Bearer <WEBHOOK_SECRET>
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token |
| `CLIENT_ID` | Bot application ID |
| `ENVIRONMENT` | `dev` / `stage` / `prod` |
| `LOG_CHANNEL_ID` | Channel for moderation log posts |
| `MOD_GUILD_ID` | Guild for mod-only slash commands (optional) |
| `PORT` | Express listen port (default 3000) |
| `WEBHOOK_SECRET` | Shared secret for Bearer auth |
| `DISCORD_LOG_WEBHOOK_URL` | Logger webhook — posts interaction logs |
| `DISCORD_ERROR_WEBHOOK_URL` | Logger webhook — posts error logs |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default 5432) |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | PostgreSQL database name |
