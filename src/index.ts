import { ShardingManager } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('DISCORD_TOKEN is not defined in environment variables');
    process.exit(1);
}

// Create sharding manager
const manager = new ShardingManager(path.join(__dirname, 'bot.js'), {
    token,
    totalShards: 'auto',
});

manager.on('shardCreate', (shard) => {
    console.log(`Launched shard ${shard.id}`);
});

// Spawn shards
manager.spawn().catch((error: Error) => {
    console.error('Failed to spawn shards:', error);
    process.exit(1);
});
