import { ShardingManager } from 'discord.js';
import path from 'path';
import { createServer } from '@vulps22/pathfinder';
import { Logger } from '@vulps22/logger';
import { entitlementService } from './services';

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

// Reconcile entitlements on startup, then on an interval, as a backstop for any
// gateway entitlement events missed while the bot was offline. Runs once in the
// ShardingManager process (not per-shard) since it only needs the bot token.
entitlementService.reconcile().catch(console.error);
const entitlementReconcileInterval = setInterval(() => {
    entitlementService.reconcile().catch(console.error);
}, 60 * 60 * 1000);
entitlementReconcileInterval.unref();

// Start the bot
startBot().catch((error: Error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});
