# Truth or Dare Bot

A feature-rich Discord bot for playing Truth or Dare with your community. Built with TypeScript, Discord.js v14, and PostgreSQL.

## Features

### Core Gameplay
- `/truth` - Get a random truth question
- `/create` - Submit custom truth or dare questions for community approval
- Interactive button controls (Done, Skip, Failed)
- NSFW-aware question filtering

### Moderation System
- Approval queue for user-submitted questions
- Moderation dashboard with user profiles
- Question approval/rejection workflow
- User and question banning system with categorized ban reasons
- Automated moderation reports and tracking

### Gamification
- XP system for user engagement
- Global and server-specific leaderboards
- Top 10 rankings with user position tracking
- Activity tracking and analytics

### Premium Features
- Premium tier support for servers
- Enhanced features for premium members

### Technical Features
- Multi-shard architecture for scalability
- Comprehensive test coverage with Jest
- Type-safe TypeScript codebase
- Database migration system (rollout/rollback)
- Structured logging with sensitive data sanitization
- PostgreSQL with organized schema separation

## Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** database
- **Discord Bot Token** - [Create a bot application](https://discord.com/developers/applications)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Vulps22/project-encourage-reborn.git
cd project-encourage-reborn
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=truth_or_dare_bot

# Logging
LOG_CHANNEL_ID=your_log_channel_id_here

# Environment
NODE_ENV=development
```

### 4. Set Up the Database

Create a PostgreSQL database and run the installation script:

```bash
npm run db:install
```

This will create all necessary tables, views, triggers, and functions.

### 5. Build the Project

```bash
npm run build
```

### 6. Start the Bot

```bash
npm start
```

For development with auto-rebuild:

```bash
npm run dev
```

## Commands

| Command | Description | NSFW |
|---------|-------------|------|
| `/truth` | Get a random truth question | Yes |
| `/create` | Submit a custom truth or dare question | Yes |

## Project Structure

```
.
├── database/
│   ├── migrations/      # Database migration files (#N_rollout.sql, #N_rollback.sql)
│   ├── schemas/         # Current database schema (source of truth)
│   │   ├── analytics/   # Leaderboard views and analytics
│   │   ├── moderation/  # Moderation tables and reports
│   │   ├── premium/     # Premium feature tables
│   │   ├── question/    # Question tables and triggers
│   │   ├── server/      # Server configuration
│   │   ├── system/      # System tables (locks, metadata)
│   │   └── user/        # User data and XP tracking
│   └── scripts/         # Database management scripts
├── src/
│   ├── _handlers/       # Command, button, and select menu handlers
│   │   ├── buttons/     # Button interaction handlers
│   │   ├── commands/    # Slash command handlers
│   │   └── selects/     # Select menu handlers
│   ├── builders/        # Embed and message builders
│   ├── config/          # Bot configuration and constants
│   ├── errors/          # Custom error classes
│   ├── events/          # Discord.js event handlers
│   ├── interface/       # TypeScript interfaces
│   ├── services/        # Business logic services
│   ├── structures/      # Custom Discord.js structure wrappers
│   ├── types/           # Type definitions
│   ├── utils/           # Utility functions and helpers
│   ├── views/           # Message embeds and UI components
│   ├── bot.ts           # Bot shard logic
│   └── index.ts         # Entry point (sharding manager)
└── tests/               # Jest test files (co-located with source)
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run coverage
```

### Linting

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

### Database Migrations

```bash
# Install fresh database (WARNING: destructive)
npm run db:install

# Apply pending migrations
npm run db:rollout -- <issue_number>

# Rollback a migration
npm run db:rollback -- <issue_number>
```

## Database Schema

The database uses PostgreSQL with multiple schemas for organization:

- **public** - Default schema for core tables
- **analytics** - Leaderboard views and statistics
- **moderation** - Moderation tracking and reports
- **premium** - Premium feature data
- **question** - Question storage and metadata
- **server** - Server-specific configurations
- **system** - System locks and metadata
- **user** - User profiles and XP tracking

### Key Tables

- `question.questions` - All truth/dare questions
- `user.users` - User profiles and XP
- `moderation.reports` - Moderation activity log
- `server.servers` - Server configurations
- `analytics.leaderboard_recent_top10` - Cached leaderboard data

## Architecture

### Sharding
The bot uses Discord.js's ShardingManager for horizontal scaling across multiple processes.

### Services Layer
Business logic is organized into service classes:
- `DatabaseService` - Database connection and query execution
- `QuestionService` - Question CRUD and random selection
- `UserService` - User management and XP tracking
- `ModerationService` - Moderation workflows and approval queue
- `ServerService` - Server configuration management
- `UserTrackingService` - Activity tracking and analytics

### Interaction Handling
Custom wrapper classes extend Discord.js interactions:
- `BotCommandInteraction` - Enhanced slash command interactions
- `BotButtonInteraction` - Button interaction handling
- `BotSelectMenuInteraction` - Select menu handling
- `BotComponentInteraction` - Base component interaction class

### Logging
The `Logger` utility provides structured logging with:
- Automatic sensitive data sanitization (tokens, passwords)
- Console and Discord channel output
- Debug/info/warn/error levels

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style (enforced by ESLint)
- Add TypeScript types (no `any`)
- Update documentation as needed
- Test database migrations (both rollout and rollback)

## License

ISC

## Support

For issues, questions, or suggestions, please [open an issue](https://github.com/Vulps22/project-encourage-reborn/issues).

## Acknowledgments

Built with:
- [Discord.js](https://discord.js.org/) - Discord API library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Jest](https://jestjs.io/) - Testing framework
