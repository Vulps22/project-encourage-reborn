import { ShardingManager } from 'discord.js';
import path from 'path';
import { createServer } from '@vulps22/dynamic-endpoint-router';
import { Logger } from './utils/Logger';

// Initialize Logger with sensitive values from .env
Logger.initialize();

const token = process.env.PE_DISCORD_TOKEN;

if (!token) {
    console.error('DISCORD_TOKEN is not defined in environment variables');
    process.exit(1);
}

/**
 * Start the bot by spawning shards
 */
async function startBot(): Promise<void> {
    Logger.debug('Starting bot...');

    // Create sharding manager
    const manager = new ShardingManager(path.join(__dirname, 'bot.js'), {
        token,
        totalShards: 'auto',
    });

    manager.on('shardCreate', (shard) => {
        Logger.debug(`Launched shard ${shard.id}`);
    });

    // Spawn shards
    await manager.spawn();
}

// Start webhook server
const webhookPort = process.env.PE_PORT ? parseInt(process.env.PE_PORT) : 3000;
createServer({
    port: webhookPort,
    routesPath: path.join(__dirname, 'routes'),
}).catch(console.error);

// Start the bot
startBot().catch((error: Error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});
