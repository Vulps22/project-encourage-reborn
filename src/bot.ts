import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { Handler, Command, Logger } from './utils';
import { EventHandler } from './types';
import { Config } from './config';
import { BotButtonInteraction, BotSelectMenuInteraction } from './structures';

/**
 * Initialize global objects
 */
function initializeGlobals(client: Client): void {
    global.client = client;
    global.config = Config;
    global.commands = new Collection<string, Command>();
    global.buttons = new Collection<string, Handler<BotButtonInteraction>>();
    global.selects = new Collection<string, Handler<BotSelectMenuInteraction>>();
}

/**
 * Load commands from a specific directory
 */
function loadCommandsFromDirectory(dirPath: string, commandType: 'global' | 'mod'): void {
    if (!existsSync(dirPath)) {
        return;
    }

    const commandFiles = readdirSync(dirPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = join(dirPath, file);
        const command: Command = require(filePath).default;
        global.commands.set(command.name, command);
        Logger.debug(`Loaded ${commandType} command: ${command.name}`);
    }
}

/**
 * Load all commands (global and mod)
 */
function loadCommands(): void {
    const globalCommandsPath = join(__dirname, '_handlers', 'commands', 'global');
    const modCommandsPath = join(__dirname, '_handlers', 'commands', 'mod');
    
    loadCommandsFromDirectory(globalCommandsPath, 'global');
    loadCommandsFromDirectory(modCommandsPath, 'mod');
}

/**
 * Load handlers recursively from a directory with prefix support
 */
function loadHandlersFromDirectory<T>(
    dirPath: string, 
    collection: Collection<string, Handler<T>>,
    prefix: string = ''
): void {
    const items = readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
        const itemPath = join(dirPath, item.name);
        
        if (item.isDirectory()) {
            const newPrefix = prefix ? `${prefix}_${item.name}` : item.name;
            loadHandlersFromDirectory(itemPath, collection, newPrefix);
        } else if (item.isFile() && item.name.endsWith('.js')) {
            const handler: Handler<T> = require(itemPath).default;
            const fullHandlerName = prefix ? `${prefix}_${handler.name}` : handler.name;
            collection.set(fullHandlerName, handler);
            Logger.debug(`Loaded ${collection === global.buttons ? 'button' : 'select menu'}: ${fullHandlerName}`);
        }
    }
}

/**
 * Load all button handlers
 */
function loadButtons(): void {
    const buttonsPath = join(__dirname, '_handlers', 'buttons');
    
    if (existsSync(buttonsPath)) {
        loadHandlersFromDirectory(buttonsPath, global.buttons);
    }
}

/**
 * Load all select menu handlers
 */
function loadSelectMenus(): void {
    const selectsPath = join(__dirname, '_handlers', 'selects');
    
    if (existsSync(selectsPath)) {
        loadHandlersFromDirectory(selectsPath, global.selects);
    }
}

/**
 * Load and register all event handlers
 */
function loadEvents(client: Client): void {
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
}

/**
 * Register all commands with Discord API
 */
async function registerCommands(): Promise<void> {
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
        throw new Error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables');
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    const globalCommands = collectCommandsFromDirectory(join(__dirname, '_handlers', 'commands', 'global'));
    const modCommands = collectCommandsFromDirectory(join(__dirname, '_handlers', 'commands', 'mod'));

    await registerGlobalCommands(rest, globalCommands);
    await registerModCommands(rest, modCommands);
}

/**
 * Collect commands from a directory
 */
function collectCommandsFromDirectory(dirPath: string): Command[] {
    if (!existsSync(dirPath)) {
        return [];
    }

    const commands: Command[] = [];
    const commandFiles = readdirSync(dirPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command: Command = require(join(dirPath, file)).default;
        commands.push(command);
    }
    
    return commands;
}

/**
 * Register global commands with Discord
 */
async function registerGlobalCommands(rest: REST, commands: Command[]): Promise<void> {
    if (commands.length === 0) {
        Logger.debug('No global commands to register');
        return;
    }

    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        Logger.debug(`Registered ${commands.length} global commands`);
    } catch (error) {
        Logger.error(`Failed to register global commands: ${error}`);
        throw error;
    }
}

/**
 * Register mod commands to specific guild
 */
async function registerModCommands(rest: REST, commands: Command[]): Promise<void> {
    if (commands.length === 0) {
        Logger.debug('No mod commands to register');
        return;
    }

    if (!process.env.MOD_GUILD_ID) {
        Logger.debug('MOD_GUILD_ID not set - mod commands will not be registered');
        return;
    }

    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.MOD_GUILD_ID),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        Logger.debug(`Registered ${commands.length} mod commands to guild ${process.env.MOD_GUILD_ID}`);
    } catch (error) {
        Logger.error(`Failed to register mod commands: ${error}`);
        throw error;
    }
}

/**
 * Initialize and start the Discord bot
 */
function startBot(): void {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    initializeGlobals(client);
    loadCommands();
    loadButtons();
    loadSelectMenus();
    loadEvents(client);

    client.once(Events.ClientReady, async () => {
        Logger.debug('Client is ready. Registering commands...');
        await registerCommands();
        Logger.debug('Commands registered successfully');
    });

    client.login().catch((error: Error) => {
        console.error('Failed to login:', error);
        process.exit(1);
    });
}

// Start the bot
startBot();
