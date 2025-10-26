# Truth or Dare Discord Bot - Development Guidelines

## Project Overview
A Discord bot for playing Truth or Dare with voting, XP systems, and user-submitted questions. Built with Node.js, TypeScript, and Discord.js v14.

## Commit Standards
- All commits MUST follow the format: `#<issue-number> - <message>`
- Message must be 50 characters or less
- Use imperative mood: "Add feature" not "Added feature"

## Tech Stack
- **Runtime**: Node.js v18+
- **Language**: TypeScript (strict mode)
- **Framework**: Discord.js v14
- **Database**: PostgreSQL
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript plugin

### Approved Dependencies
- discord.js - Discord API
- pg - PostgreSQL database driver
- @types/pg - TypeScript definitions for pg (dev dependency)
- canvas - Image generation for rank cards
- dotenv - Environment variables
- jest - Testing framework
- ts-jest - TypeScript support for Jest
- typescript - TypeScript compiler

### Forbidden
- **NO ORM** - No Prisma, TypeORM, Sequelize, etc.
- **NO Repositories** - Services handle data access directly
- **NO `any` type** - Use proper types or `unknown` with type guards

## TypeScript Configuration

### Strict Mode Required
- `strict: true` in tsconfig.json
- No implicit any
- Strict null checks
- All functions must have return types

### File Extensions
- Source files: `.ts`
- Test files: `.test.ts`
- Type definition files: `.d.ts` (when needed for external modules)

## Architecture Principles

### SOLID Principles
All code MUST follow SOLID principles:

**Single Responsibility Principle**
- Each class/module does ONE thing
- QuestionService handles questions, VotingService handles votes
- If a class has multiple reasons to change, split it

**Open/Closed Principle**
- Extend behavior without modifying existing code
- Use inheritance or composition for new features

**Liskov Substitution Principle**
- Child classes must be substitutable for parents
- BotButtonInteraction can be used anywhere BotInteraction is expected

**Interface Segregation Principle**
- Keep interfaces small and focused
- Don't force classes to implement methods they don't need

**Dependency Inversion Principle**
- Depend on abstractions, not concretions
- Services receive dependencies via constructor (dependency injection)

### Services, Not Repositories
- Services handle BOTH business logic AND database access
- Do NOT create a repository pattern/layer
- Services use DatabaseService for data operations
- Example: QuestionService handles question business logic + database calls via DatabaseService

### One File, One Object
- Each file exports exactly ONE class, function, interface, or type
- File name matches the exported object name
- QuestionService.ts exports class QuestionService
- buildQuestionEmbed.ts exports function buildQuestionEmbed
- Question.ts exports interface Question or class Question

## Code Organization

### Directory Structure
```
src/
├── commands/       # Thin controllers that orchestrate services and views
│   ├── tests/      # Command tests mirroring command structure
│   └── index.ts    # Barrel file exporting all commands
├── services/       # Business logic + database access via DatabaseService
│   ├── tests/      # Service tests mirroring service structure
│   └── index.ts    # Barrel file exporting all services
├── views/          # Pure functions returning Discord message objects
│   ├── tests/      # View tests mirroring view structure
│   └── index.ts    # Barrel file exporting all views
├── buttons/        # Button interaction handlers
│   ├── tests/      # Button tests mirroring button structure
│   └── index.ts    # Barrel file exporting all buttons
├── selectMenus/    # Select menu interaction handlers
│   ├── tests/      # Select menu tests mirroring selectMenu structure
│   └── index.ts    # Barrel file exporting all selectMenus
├── structures/     # BotInteraction wrapper classes
│   ├── tests/      # Structure tests mirroring structure structure
│   └── index.ts    # Barrel file exporting all structures
├── models/         # Data models (classes or interfaces)
│   ├── tests/      # Model tests mirroring model structure
│   └── index.ts    # Barrel file exporting all models
├── events/         # Discord event handlers
│   ├── tests/      # Event tests mirroring event structure
│   └── index.ts    # Barrel file exporting all events
├── types/          # Shared TypeScript types and interfaces
│   └── index.ts    # Barrel file exporting all types
└── utils/          # Shared utilities (Database, Logger, etc.)
    ├── tests/      # Utility tests mirroring utility structure
    └── index.ts    # Barrel file exporting all utilities
```

### Test File Structure
Tests are organized in a `tests/` subdirectory that mirrors the source structure:

- Source: `src/services/QuestionService.ts`
- Test: `src/services/tests/QuestionService.test.ts`

- Source: `src/services/userGenerated/QuestionService.ts`
- Test: `src/services/tests/userGenerated/QuestionService.test.ts`

This keeps tests organized separately while maintaining clear correspondence to source files.

### Barrel Files (index.ts)
Each directory under `src/` MUST have an `index.ts` barrel file that exports all modules in that directory.

**Purpose**: Enables clean imports throughout the codebase.

**Barrel files must be kept up to date** when new files are added to a directory.

### Import Organization
Imports MUST be kept in alphabetical order:

1. **Import lines** are sorted alphabetically by file path
2. **Destructured imports** inside `{}` are sorted alphabetically

**Correct**:
```typescript
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import { questionService, votingService, xpService } from '../services';
import { buildQuestionEmbed } from '../views';
```

**Incorrect**:
```typescript
import { votingService, questionService, xpService } from '../services';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { buildQuestionEmbed } from '../views';
```

### Commands (Thin Controllers)
Commands orchestrate services and views. NO business logic.

**Rules**:
- Commands receive already-wrapped BotInteraction (or child class)
- Keep execute() under 30 lines
- Handle errors gracefully
- NO business logic in commands
- Flow: defer → call service → build view → send response
- All parameters must be typed

### Services
Services contain business logic and use DatabaseService for data access.

**Rules**:
- One service per domain (QuestionService, VotingService, XPService)
- Receive dependencies via constructor (dependency injection)
- Use DatabaseService for all data operations
- Throw meaningful errors with context
- All methods must have explicit return types
- All parameters must be typed

### Views
Pure functions that return Discord message objects. NO logic, NO state.

**Rules**:
- Pure functions only - same input = same output
- Return message objects (embeds, components, content)
- NO database calls, NO business logic
- Just formatting and UI construction
- All parameters and return types must be explicit

### Buttons & Select Menus
Component interaction handlers.

**Rules**:
- Receive already-wrapped BotInteraction
- Use params.get() to access custom ID data
- Keep logic minimal - delegate to services
- Type the interaction parameter correctly

### Models
Data models representing database entities or domain objects.

**Rules**:
- Can be classes OR interfaces (prefer interfaces for simple data, classes when methods needed)
- NOT ORM entities - NO database methods
- NO .save(), .delete(), .update() methods
- NO static .find(), .findById(), .create() methods
- Used ONLY for type definitions and creating consistent objects from database rows
- All database operations go through services via DatabaseService
- All properties must be explicitly typed

**If you find yourself adding database methods to a model, STOP and ASK.**

## Database Access

### DatabaseService
All database operations MUST go through the DatabaseService class.

**Why**: Adheres to Single Responsibility Principle - DatabaseService handles data access, other services handle business logic.

### Using DatabaseService
Services should use DatabaseService methods for all database operations (get, list, count, insert, update, delete).

All DatabaseService methods must have proper TypeScript return types.

### When to Use Raw Queries
Use `db.query(sql, params)` only for:
- Complex joins
- Aggregations
- Subqueries
- Performance-critical custom SQL

**Always use parameterized queries** for security.

### AI Guidelines for Database Operations
Before writing raw SQL in a service, ask:
"Does DatabaseService already have a method for this operation?"

If yes, use it. If no, ASK whether it should be added to DatabaseService before writing raw SQL.

### Testing Database Code
Mock DatabaseService in tests with jest.fn(), not individual queries.

## Database Migrations

### Structure
```
database/
├── schemas/             # PostgreSQL schema organization (single source of truth)
│   ├── core/            # Core tables (users, servers, questions, etc.)
│   │   ├── tables/
│   │   ├── triggers/
│   │   └── views/
│   ├── analytics/       # Analytics tables (leaderboards, etc.)
│   ├── moderation/      # Moderation tables (reports, bans)
│   ├── premium/         # Premium feature tables
│   └── system/          # System configuration tables
├── migrations/
│   ├── applied/         # Production-applied migrations
│   ├── #23_rollout.sql  # Pending migrations
│   ├── #23_rollback.sql
│   └── ...
└── scripts/
    ├── rollout.js       # Apply migrations
    ├── rollback.js      # Revert migrations
    └── fresh-install.js # Create DB from schema
```

### PostgreSQL Schema Organization
The database uses PostgreSQL schemas to organize tables logically:
- `core` - Main bot functionality (users, servers, questions, votes)
- `analytics` - Analytics and leaderboard data
- `moderation` - Moderation features (reports, bans)
- `premium` - Premium features (purchasables, entitlements, adverts)
- `system` - System configuration

Each schema directory contains:
- `tables/` - Table definitions with `IF NOT EXISTS`
- `triggers/` - PostgreSQL trigger functions
- `views/` - Cross-schema views with proper schema qualification

### PostgreSQL-Specific Patterns

**Foreign Key Constraints**:
- Use `DEFERRABLE INITIALLY DEFERRED` for constraints that may have circular dependencies
- Format: `CONSTRAINT "name" FOREIGN KEY ("column") REFERENCES "table" ("id") DEFERRABLE INITIALLY DEFERRED`

**ENUM Types**:
- Create with DO blocks for idempotency:
```sql
DO $$ BEGIN
    CREATE TYPE enum_name AS ENUM ('value1', 'value2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

**Triggers**:
- Use PostgreSQL function + trigger pattern (not inline triggers):
```sql
CREATE OR REPLACE FUNCTION update_table_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_table_updated ON "table_name";
CREATE TRIGGER trg_update_table_updated
    BEFORE UPDATE ON "table_name"
    FOR EACH ROW
    EXECUTE FUNCTION update_table_updated();
```

**Parameterized Queries**:
- Use `$1`, `$2`, `$3` placeholders (not `?`)
- Example: `db.query('SELECT * FROM users WHERE id = $1', [userId])`

**Result Handling**:
- Access results via `result.rows` (array of row objects)
- Check row count via `result.rowCount`
- Single row: `result.rows[0]`

**Schema Qualification**:
- Always qualify table names in cross-schema references: `"core"."users"`
- Views referencing multiple schemas must use full qualification

### Migration Naming
- Format: `#<issue>_rollout.sql` and `#<issue>_rollback.sql`
- Example: `#23_rollout.sql`, `#23_rollback.sql`
- One issue = One rollout/rollback pair

### Making Changes

**During Development:**
1. Create `#<issue>_rollout.sql` and `#<issue>_rollback.sql` in `migrations/`
2. Write your ALTER/CREATE statements
3. Test: `npm run db:rollout <issue>`
4. Verify changes work
5. Test rollback: `npm run db:rollback <issue>`
6. If you need changes: rollback, modify files, rollout again
7. Update corresponding schema file(s) in `database/schemas/` to match final state
8. Commit migration files AND schema files together

**File Movement:**
- Manual rollout/rollback (with issue number): Files stay in `migrations/` - you're iterating
- Automatic rollout (no issue number): Files move to `migrations/applied/` - this is deployment

### Scripts

**`npm run db:fresh-install`**
- Create new database from schema files
- Used for: new dev environment, new prod setup

**`npm run db:rollout [issue]`**
- With issue number: Apply specific migration, files stay in `migrations/`
- Without issue number: Apply ALL pending migrations, move to `applied/`

**`npm run db:rollback <issue>`**
- Requires issue number
- If in `migrations/`: Execute rollback, files stay in place (dev iteration)
- If in `applied/`: Execute rollback, move files back to `migrations/` (production fix)

### Rollout and Rollback Requirements
- Rollout and rollback MUST be perfect inverses
- Test both directions before committing
- Update schema files to reflect final state after rollout

### AI Guidelines for Migrations
1. Always create BOTH `#<issue>_rollout.sql` and `#<issue>_rollback.sql`
2. Update the schema file(s) to reflect the final state
3. Test rollback works before committing
4. If unsure about migration approach, ASK

## Global Client

The Discord.js Client instance is available globally as `global.client`.

**Why**: The client is a singleton by nature in Discord bots. Making it global simplifies access for utilities like Logger without dependency injection overhead.

### TypeScript Declaration
Create `src/types/global.d.ts`:
```typescript
import { Client } from 'discord.js';

declare global {
    var client: Client;
}

export {};
```

### Initialization
In the main entry point (index.ts), set the global client:
```typescript
global.client = new Client({ ... });
```

### Usage
Access the client anywhere without importing:
```typescript
const channel = await global.client.channels.fetch(channelId);
```

### When to Use Global Client
- Logger utility (for sending log messages)
- Utilities that need Discord API access
- Event handlers (already have access via parameters, but can use global if needed)

### When NOT to Use Global Client
- Services should receive necessary data via parameters, not access global client directly
- Commands receive interaction which has client reference
- Prefer passing data over global access when practical

## Logging

### Logger Utility
All interactions MUST be logged using the static Logger class.

**Purpose**: Track bot usage, monitor execution flow, and debug issues in production.

### Implementation
Logger is a static utility class that uses `global.client` to send messages to the log channel.

No initialization or dependency injection needed - simply call static methods:
```typescript
const executionId = await Logger.logInteractionReceived(interaction);
await Logger.updateExecution(executionId, 'Success');
```

### Execution Flow Logging
Every interaction gets an execution ID that tracks its lifecycle through status updates.

**Flow**:
1. Interaction received → Logger creates log message, returns executionId (Discord message ID)
2. executionId passed to BotInteraction constructor
3. BotInteraction can update log status via `interaction.updateLog(status)`
4. Logger.updateExecution() edits the Discord log message in real-time

### Log Statuses

**Key Milestones** (in order):
1. `Received` - Interaction received by bot
2. `Checking permissions` - Before permission validation
3. `Executing` - Handler is running
4. `Success` - Completed successfully

**Failure Reasons** (terminal states):
- `Failed: User lacks permissions` - User doesn't have required permissions
- `Failed: Bot lacks permissions` - Bot doesn't have required permissions  
- `Failed: Command not found` - Command doesn't exist
- `Failed: Validation error - <details>` - Input validation failed
- `Failed: Database error` - Database operation failed
- `Failed: Timeout` - Operation timed out
- `Failed: Error - <message>` - General error with details

### Log Format
Format: `Event Type: details | Server: name - id | User: username - id || Status`

Example progression:
```
Command: truth | Server: My Server - 123456 | User: john - 789012 || Received
Command: truth | Server: My Server - 123456 | User: john - 789012 || Checking permissions
Command: truth | Server: My Server - 123456 | User: john - 789012 || Executing
Command: truth | Server: My Server - 123456 | User: john - 789012 || Success
```

### Logger Implementation
The Logger class must provide:
- `logInteractionReceived(interaction): Promise<string>` - Creates log, returns executionId
- `updateExecution(executionId: string, status: string): Promise<void>` - Updates log status

### BotInteraction Integration
BotInteraction receives executionId in constructor and provides:
- `updateLog(status: string): Promise<void>` - Convenience method to update log

### AI Guidelines for Logging
- Event handler manages milestone logging (Received, Checking permissions, Executing, Success)
- Handlers should NOT manually log unless adding specific context
- Always catch errors and log failure reasons with details
- Use specific failure reasons, not generic "Failed"

### Log Destination
Logs are sent to a dedicated Discord channel (configured via LOG_CHANNEL_ID environment variable).

## Testing Requirements

### Coverage Requirement
- **Minimum 75% code coverage** across the entire codebase
- All new features MUST include unit tests
- All bug fixes MUST include regression tests
- Run `npm test` to execute tests
- Run `npm run coverage` to check coverage

### Test Files
Tests are placed in a `tests/` subdirectory within each `src/` folder, mirroring the source structure.

Examples:
- `src/services/QuestionService.ts` → `src/services/tests/QuestionService.test.ts`
- `src/services/userGenerated/CustomService.ts` → `src/services/tests/userGenerated/CustomService.test.ts`

Test file naming: `<filename>.test.ts`

### What to Test
- **Services**: All public methods, error cases, edge cases
- **Views**: All exported functions with different inputs
- **Commands**: Execution flow and error handling
- **Utilities**: All edge cases and error conditions

### Test Structure
Use Jest with ts-jest. Use clear Arrange-Act-Assert pattern in describe/it blocks.

### Mocking Guidelines
- Mock external dependencies (Discord.js, DatabaseService)
- Use Jest's built-in mocking: jest.fn(), mockResolvedValue(), etc.
- Don't mock the class you're testing
- Reset mocks between tests with beforeEach()
- Type your mocks properly

## Code Style

### Type Annotations Required
All functions, methods, parameters, and return values MUST have explicit type annotations.

**Never use `any`** - use proper types or `unknown` with type guards.

### Naming Conventions
- **Classes**: PascalCase (QuestionService, BotInteraction)
- **Interfaces**: PascalCase (Question, VoteData)
- **Types**: PascalCase (QuestionType, VoteResult)
- **Functions/Methods**: camelCase (getRandomQuestion, buildEmbed)
- **Constants**: UPPER_SNAKE_CASE (MAX_VOTES, DEFAULT_XP)
- **Files**: Match exported object (QuestionService.ts, buildQuestionEmbed.ts)
- **Private Methods**: Prefix with underscore (_queryDatabase, _validateInput)

### Error Handling
- Always use try/catch in async functions
- Provide meaningful error messages with context
- Log errors before throwing/returning
- Never swallow errors silently
- Type your errors properly

### BotInteraction Pattern
All interaction handlers receive wrapped interactions from the event handler.

**Event handler wraps once** based on interaction type (Command, Button, SelectMenu).

**Handlers receive wrapped interaction** - Never wrap again in handlers.

The event handler is responsible for:
- Wrapping the raw Discord.js interaction
- Routing to the correct handler
- Error handling
- Logging milestones

All BotInteraction types have proper TypeScript definitions.

## Dependency Injection

Services receive dependencies via constructor with proper typing.

Initialize all services in a central location (index.ts or container.ts) and export them with proper types.

## Custom ID Format for Buttons

Buttons use a structured custom ID format: `prefix_action_key:value_key:value`

Examples:
- `vote_done_msgId:12345`
- `approve_question_id:67890_modId:11111`

BotButtonInteraction automatically parses this format providing:
- `interaction.baseId` - prefix_action
- `interaction.action` - action part
- `interaction.params` - Map<string, string> of key:value pairs
- `interaction.params.get('key')` - Get specific value

## Terminal Command Execution

When running commands in the terminal, if a command fails with "command not found":
1. Check if the first character of the command was truncated
2. If truncated, retry the same command with a space prefix: ` command args`
3. This might work around a potential bug in terminal command transmission

## When in Doubt

If these instructions are incomplete or unclear:
1. ASK for clarification rather than guessing
2. Look at existing code for established patterns
3. Propose a solution and ask for confirmation

**Trust these instructions** - they define the architecture and standards for this project.