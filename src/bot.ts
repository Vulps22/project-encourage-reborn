import { Client, GatewayIntentBits } from 'discord.js';

// Initialize Discord client for this shard
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

// Set global client
global.client = client;

// Event handlers will be loaded here
client.once('clientReady', () => {
    console.log(`Shard ${client.shard?.ids[0]} logged in as ${client.user?.tag}`);
});

// Login to Discord (token is passed by ShardingManager)
client.login().catch((error: Error) => {
    console.error('Failed to login:', error);
    process.exit(1);
});
