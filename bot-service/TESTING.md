# Project Encourage — Testing Checklist

Work through each section in order — later sections depend on data created earlier.

---

## Prerequisites

- [ ] Postgres is running (`docker compose up -d`)
- [ ] `database-service` is running
- [ ] `project-encourage-reborn` is running (no errors in console)
- [ ] `project-moderator` is running (no errors in console)
- [ ] Bot is invited to a **test server** with admin permissions
- [ ] You have noted the test server's channel IDs

---

## 1. Server Setup Wizard

Trigger: `/setup` (requires Manage Server permission)

### 1a. Happy path — accept everything
- [ ] Run `/setup`
- [ ] Embed appears with Terms of Service and **Accept** / **Decline** buttons
- [ ] Click **Accept Terms**
- [ ] Embed updates to Content Rules with **Accept Rules** / **Decline Rules** buttons
- [ ] Click **Accept Rules**
- [ ] Channel select menu appears
- [ ] Select an announcement channel
- [ ] Confirmation message appears — server is configured

### 1b. Decline Terms
- [ ] Run `/setup`
- [ ] Click **Decline Terms**
- [ ] Bot leaves the server (or sends farewell message)

### 1c. Decline Rules
- [ ] Run `/setup`
- [ ] Accept Terms → **Decline Rules**
- [ ] Channel select still appears (server gets configured without `can_create` permission)

---

## 2. Info Commands

- [ ] `/help` — embed lists all available commands
- [ ] `/rules` — ephemeral embed shows content submission rules
- [ ] `/vote` — ephemeral information about current skips available, and where to vote

---

## 3. Question Submission (`/create`)

> Requires `can_create` permission (granted by accepting rules in setup)

### 3a. Submit a Truth
- [ ] Run `/create type:truth question:I am a truth to be approved`
- [ ] Success ephemeral response with question ID
- [ ] Check MS — new question appears in the moderation queue channel

### 3b. Submit a Dare
- [ ] Run `/create type:dare question:I am a dare to be approved`
- [ ] Success ephemeral response with question ID

### 3c. Submit a question to be banned
- [ ] Run `/create type:truth question:I am a truth to be banned`
- [ ] Note the question ID for MS ban testing

### 3d. Validation
- [ ] Try `/create` with question text over 500 characters — should be rejected

---

## 4. Playing Questions

> Requires at least one **approved** question in the database (approve one in MS first if needed)

### 4a. Truth
- [ ] Run `/truth`
- [ ] Challenge embed appears with **Done** / **Failed** / **Skip** / **Report** buttons

### 4b. Dare
- [ ] Run `/dare`
- [ ] Challenge embed appears with **Done** / **Failed** / **Skip** / **Report** buttons

### 4c. Random
- [ ] Run `/random`
- [ ] Challenge embed appears (roughly 50/50 truth/dare)

---

## 5. Challenge Voting Buttons

> Start a challenge first with `/truth` or `/dare`

- [ ] Click **Done** — done count increments
- [ ] Click **Failed** — failed count increments
- [ ] Click **Skip** — uses one Skip item from inventory *(needs a skip item — earn one via vote webhook or seed data)*
- [ ] Click **Skip** with no skips remaining — error message shown

--- 

## 6. Report Modal (from challenge)

- [ ] Start a challenge with `/truth` or `/dare`
- [ ] Click **Report**
- [ ] Modal opens with a reason text field (10–500 chars)
- [ ] Submit with a valid reason — success message, report appears in MS
- [ ] Try submitting with fewer than 10 characters — should be rejected

---

## 7. `/report` Command

### 7a. Report a question
- [ ] Run `/report question` with a valid question ID and reason
- [ ] Autocomplete suggestions appear when typing the question ID
- [ ] Success message shown, report appears in MS

### 7b. Report a server
- [ ] Run `/report server` with a reason
- [ ] Success message shown, report appears in MS

---

## 8. Top.gg Vote Webhook

- [ ] Send a POST to `http://localhost:{WEBHOOK_PORT}/webhook/vote` with a valid HMAC-signed payload
- [ ] User receives a **Skip** storable (capped at 10)
- [ ] Sending when already at 10 skips — no error, count stays at 10

---

## 9. Moderation Buttons (PE copy)

> PE also handles moderation interactions forwarded from MS — test these via the MS testing checklist, confirming the actions reflect in PE's database.

---

## Notes

- Question voting thresholds may need seeding/config to trigger reliably in testing
- The announcement channel follower uses IPC across shards — test with multiple shards if possible
