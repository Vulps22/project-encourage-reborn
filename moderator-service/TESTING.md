# Project Moderator — Testing Checklist

Work through each section in order — moderation actions require data submitted from PE first.

---

## Prerequisites

- [ ] Postgres is running (`docker compose up -d`)
- [ ] `database-service` is running
- [ ] `project-encourage-reborn` is running and set up in a test server
- [ ] `project-moderator` is running (no errors in console)
- [ ] Bot is in the **moderator guild** (`MOD_GUILD_ID`)
- [ ] `TRUTHS_CHANNEL_ID` and `DARES_CHANNEL_ID` channels exist and bot has access

---

## 1. API Health Check

```bash
curl http://localhost:4001/ping
# Expected: {"message":"OK"}
```

- [ ] Returns `200 OK` with `{"message":"OK"}`

---

## 2. Question Moderation

> Submit questions from PE first using `/create` — they appear in the MS moderation queue channel.

### 2a. Approve a question
- [ ] New question embed appears in moderation queue
- [ ] Click **Approve Question**
- [ ] Question is marked approved in the database
- [ ] Question appears in the appropriate truths/dares channel

### 2b. Ban a question
- [ ] Click **Ban Question** on a question embed
- [ ] Ban reason select menu appears
- [ ] Select a ban reason
- [ ] Question is marked banned, log is updated, any reporters are notified

### 2c. Question approval via API
```bash
curl -X POST http://localhost:4001/question \
  -H "Authorization: Bearer <WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"questionId": 1}'
```
- [ ] Question posted to the appropriate channel
- [ ] Returns success response

---

## 3. Report Moderation

> Submit reports from PE using `/report` or the **Report** button on a challenge — they appear in the MS report channel.

### 3a. Take action on a report
- [ ] Report embed appears in the report channel
- [ ] Click **Take Action**
- [ ] Embed updates to show it is being actioned (locked to acting moderator)
- [ ] Select ban reason sub-flow becomes available

### 3b. Ban a user
- [ ] Click **Take Action** on a user report
- [ ] Click **Ban User**
- [ ] User ban reason select menu appears
- [ ] Select a reason — user and all their questions/servers are banned
- [ ] Reporter is notified, log is updated

### 3c. Ban a server
- [ ] Click **Take Action** on a server report
- [ ] Click **Ban Server**
- [ ] Server ban reason select menu appears
- [ ] Select a reason — server is banned, reporter notified

### 3d. Clear a report (no action)
- [ ] Click **Clear Report**
- [ ] Report is marked cleared, reporter is notified, embed updates

### 3e. Ban reason timeout
- [ ] Click **Take Action** → **Ban User**
- [ ] Wait 60 seconds without selecting a reason
- [ ] Select menu expires gracefully (no crash)

---

## 4. User Profile Buttons

> These appear on report/moderation embeds

- [ ] Click **Show User** — ephemeral user profile embed appears
- [ ] Click **View Offender** — ephemeral offender profile embed appears
- [ ] Click **Send to Moderators** — user profile posted to moderator chat channel with jump link

---

## 5. Unban Actions

> Requires a previously banned user/server in the database

### 5a. Unban a user
- [ ] Locate a banned user embed (or trigger via a moderation action)
- [ ] Click **Unban User**
- [ ] User is unbanned, all their questions/servers are also unbanned

### 5b. Unban a server
- [ ] Click **Unban Server**
- [ ] Server `is_banned` flag cleared, `ban_reason` set to null

---

## 6. Report Submission via API

```bash
curl -X POST http://localhost:4001/report \
  -H "Authorization: Bearer <WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "123456789",
    "offenderId": "987654321",
    "type": "user",
    "serverId": "111222333",
    "reason": "Test report",
    "content": "Offensive content example"
  }'
```
- [ ] Report created in database
- [ ] Report embed appears in the MS report channel

---

## 7. Auth Checks

- [ ] Call any API endpoint **without** `Authorization` header — expect `401`
- [ ] Call any API endpoint with a **wrong** token — expect `401`
- [ ] Call with correct `WEBHOOK_SECRET` — expect success

---

## Notes

- Moderation buttons are shared with PE — actions taken in MS write to the same database PE reads from
- `takeAction` locks the report to the acting moderator for 60 seconds to prevent double-handling
