import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { Command, Logger } from './utils';
import { EventHandler } from './types';
import { Config } from './config';

// Initialize Discord client for this shard
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

// Set global client
global.client = client;

// Initialize global config
global.config = Config;

// Initialize commands collection
global.commands = new Collection<string, Command>();

// Load commands from global folder
const globalCommandsPath = join(__dirname, 'commands', 'global');
const globalCommandFiles = readdirSync(globalCommandsPath).filter(file => file.endsWith('.js'));

for (const file of globalCommandFiles) {
    const filePath = join(globalCommandsPath, file);
    const command: Command = require(filePath).default;
    global.commands.set(command.name, command);
    Logger.debug(`Loaded global command: ${command.name}`);
}

// Load commands from mod folder (if exists)
const modCommandsPath = join(__dirname, 'commands', 'mod');
if (existsSync(modCommandsPath)) {
    const modCommandFiles = readdirSync(modCommandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of modCommandFiles) {
        const filePath = join(modCommandsPath, file);
        const command: Command = require(filePath).default;
        global.commands.set(command.name, command);
        Logger.debug(`Loaded mod command: ${command.name}`);
    }
}

// Register commands to Discord
const registerCommands = async (): Promise<void> => {
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
        throw new Error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables');
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        // Separate global and mod commands
        const globalCommands: Command[] = [];
        const modCommands: Command[] = [];

        // Categorize commands based on their file location
        const globalFiles = existsSync(join(__dirname, 'commands', 'global')) 
            ? readdirSync(join(__dirname, 'commands', 'global')).filter(file => file.endsWith('.js'))
            : [];
        const modFiles = existsSync(join(__dirname, 'commands', 'mod'))
            ? readdirSync(join(__dirname, 'commands', 'mod')).filter(file => file.endsWith('.js'))
            : [];

        for (const file of globalFiles) {
            const command: Command = require(join(__dirname, 'commands', 'global', file)).default;
            globalCommands.push(command);
        }

        for (const file of modFiles) {
            const command: Command = require(join(__dirname, 'commands', 'mod', file)).default;
            modCommands.push(command);
        }

        // Register global commands
        if (globalCommands.length > 0) {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: globalCommands.map(cmd => cmd.toJSON()) }
            );
            Logger.log(`Registered ${globalCommands.length} global commands`);
        }

        // Register mod commands to specific guild
        if (modCommands.length > 0) {
            if (!process.env.MOD_GUILD_ID) {
                Logger.log('MOD_GUILD_ID not set - mod commands will not be registered');
            } else {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.MOD_GUILD_ID),
                    { body: modCommands.map(cmd => cmd.toJSON()) }
                );
                Logger.log(`Registered ${modCommands.length} mod commands to guild ${process.env.MOD_GUILD_ID}`);
            }
        }
    } catch (error) {
        Logger.log(`Failed to register commands: ${error}`);
        throw error;
    }
};

// Load and register event handlers
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const event: EventHandler = require(filePath).default;
    
    if (event.once) {
        client.once(event.event, (...args) => event.execute(...args));
    } else {
        client.on(event.event, (...args) => event.execute(...args));
    }
    
    Logger.debug(`Registered event: ${event.event} (once: ${event.once})`);
}

// Register commands when client is ready
client.once('ready', async () => {
    await registerCommands();
});

// Login to Discord (token is passed by ShardingManager)
client.login().catch((error: Error) => {
    console.error('Failed to login:', error);
    process.exit(1);
});
