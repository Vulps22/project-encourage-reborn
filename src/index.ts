import { ShardingManager } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import { DatabaseService } from './services/DatabaseService';

// Load environment variables
dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('DISCORD_TOKEN is not defined in environment variables');
    process.exit(1);
}

// Verify required database environment variables
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

if (!dbHost || !dbUser || !dbPassword || !dbName) {
    console.error('Missing required database environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
    process.exit(1);
}

/**
 * Test database connection before starting shards
 */
async function testDatabaseConnection(): Promise<void> {
    console.log('Testing database connection...');
    
    const db = new DatabaseService({
        host: dbHost!,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
        user: dbUser!,
        password: dbPassword!,
        database: dbName!,
    });

    try {
        await db.testConnection();
        console.log('✓ Database connection successful');
        await db.close();
    } catch (error) {
        console.error('✗ Database connection failed:', error instanceof Error ? error.message : String(error));
        console.error('Please ensure the database is running and credentials are correct');
        process.exit(1);
    }
}

/**
 * Start the bot by spawning shards
 */
async function startBot(): Promise<void> {
    // Test database connection first
    await testDatabaseConnection();

    console.log('Starting bot...');

    // Create sharding manager
    const manager = new ShardingManager(path.join(__dirname, 'bot.js'), {
        token,
        totalShards: 'auto',
    });

    manager.on('shardCreate', (shard) => {
        console.log(`Launched shard ${shard.id}`);
    });

    // Spawn shards
    await manager.spawn();
}

// Start the bot
startBot().catch((error: Error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});
