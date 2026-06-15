import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { Handler, Command, Logger } from './utils';
import { EventHandler } from './types';
import { Config } from './config';
import { BotButtonInteraction, BotModalInteraction, BotSelectMenuInteraction } from '@vulps22/bot-interactions';
import { createServer } from '@vulps22/dynamic-endpoint-router';

/**
 * Initialize global objects
 */
function initializeGlobals(client: Client): void {
    global.client = client;
    global.config = Config;
    global.commands = new Collection<string, Command>();
    global.buttons = new Collection<string, Handler<BotButtonInteraction>>();
    global.selects = new Collection<string, Handler<BotSelectMenuInteraction>>();
    global.modals = new Collection<string, Handler<BotModalInteraction>>();
}

/**
 * Load commands from a specific directory
 */
async function loadCommandsFromDirectory(dirPath: string, commandType: 'global' | 'mod'): Promise<void> {
    if (!existsSync(dirPath)) {
        return;
    }

    const commandFiles = readdirSync(dirPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = join(dirPath, file);
        const commandModule = await import(filePath) as { default: Command };
        const command: Command = commandModule.default;
        global.commands.set(command.name, command);
        Logger.debug(`Loaded ${commandType} command: ${command.name}`);
    }
}

/**
 * Load all commands (global and mod)
 */
async function loadCommands(): Promise<void> {
    const globalCommandsPath = join(__dirname, '..', '_handlers', 'commands', 'global');
    const modCommandsPath = join(__dirname, '..', '_handlers', 'commands', 'mod');

    await loadCommandsFromDirectory(globalCommandsPath, 'global');
    await loadCommandsFromDirectory(modCommandsPath, 'mod');
}

/**
 * Load handlers recursively from a directory with prefix support
 */
async function loadHandlersFromDirectory<T>(
    dirPath: string,
    collection: Collection<string, Handler<T>>,
    prefix: string = ''
): Promise<void> {
    const items = readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
        const itemPath = join(dirPath, item.name);

        if (item.isDirectory() && item.name !== 'tests') {
            const newPrefix = prefix ? `${prefix}_${item.name}` : item.name;
            await loadHandlersFromDirectory(itemPath, collection, newPrefix);
        } else if (item.isFile() && item.name.endsWith('.js')) {
            const handlerModule = await import(itemPath) as { default: Handler<T> };
            const handler: Handler<T> = handlerModule.default;
            const fullHandlerName = prefix ? `${prefix}_${handler.name}` : handler.name;
            collection.set(fullHandlerName, handler);
            Logger.debug(`Loaded ${collection === global.buttons ? 'button' : 'select menu'}: ${fullHandlerName}`);
        }
    }
}

/**
 * Load all button handlers
 */
async function loadButtons(): Promise<void> {
    const buttonsPath = join(__dirname, '..', '_handlers', 'buttons');

    if (existsSync(buttonsPath)) {
        await loadHandlersFromDirectory(buttonsPath, global.buttons);
    }
}

/**
 * Load all select menu handlers
 */
async function loadSelectMenus(): Promise<void> {
    const selectsPath = join(__dirname, '..', '_handlers', 'selects');

    if (existsSync(selectsPath)) {
        await loadHandlersFromDirectory(selectsPath, global.selects);
    }
}

/**
 * Load all modal handlers
 */
async function loadModals(): Promise<void> {
    const modalsPath = join(__dirname, '..', '_handlers', 'modals');

    if (existsSync(modalsPath)) {
        await loadHandlersFromDirectory(modalsPath, global.modals);
    }
}

/**
 * Load and register all event handlers
 */
async function loadEvents(client: Client): Promise<void> {
    const eventsPath = join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js') && file !== 'index.js');

    for (const file of eventFiles) {
        const filePath = join(eventsPath, file);
        const eventModule = await import(filePath) as { default: EventHandler };
        const event: EventHandler = eventModule.default;

        if (event.once) {
            client.once(event.event, (...args) => void event.execute(...args));
        } else {
            client.on(event.event, (...args) => void event.execute(...args));
        }

        Logger.debug(`Registered event: ${event.event} (once: ${event.once})`);
    }
}

/**
 * Register all commands with Discord API
 */
async function registerCommands(): Promise<void> {
    if (!process.env.MS_DISCORD_TOKEN || !process.env.MS_CLIENT_ID) {
        throw new Error('Missing DISCORD_TOKEN or MS_CLIENT_ID in environment variables');
    }

    const rest = new REST({ version: '10' }).setToken(process.env.MS_DISCORD_TOKEN);

    const globalCommands = await collectCommandsFromDirectory(join(__dirname, '..', '_handlers', 'commands', 'global'));
    const modCommands = await collectCommandsFromDirectory(join(__dirname, '..', '_handlers', 'commands', 'mod'));

    await registerGlobalCommands(rest, globalCommands);
    await registerModCommands(rest, modCommands);
}

/**
 * Collect commands from a directory
 */
async function collectCommandsFromDirectory(dirPath: string): Promise<Command[]> {
    if (!existsSync(dirPath)) {
        return [];
    }

    const commands: Command[] = [];
    const commandFiles = readdirSync(dirPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const commandModule = await import(join(dirPath, file)) as { default: Command };
        const command: Command = commandModule.default;
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
            Routes.applicationCommands(process.env.MS_CLIENT_ID!),
            { body: commands.map(cmd => cmd.toJSON() ) }
        );
        Logger.debug(`Registered ${commands.length} global commands`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Logger.error(`Failed to register global commands: ${errorMessage}`);
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

    if (!process.env.GUILD_ID) {
        Logger.debug('GUILD_ID not set - mod commands will not be registered');
        return;
    }

    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.MS_CLIENT_ID!, process.env.GUILD_ID),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        Logger.debug(`Registered ${commands.length} mod commands to guild ${process.env.GUILD_ID}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Logger.error(`Failed to register mod commands: ${errorMessage}`);
        throw error;
    }
}

/**
 * Initialize and start the Discord bot
 */
async function startBot(): Promise<void> {
    Logger.initialize();
    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    initializeGlobals(client);
    await loadCommands();
    await loadButtons();
    await loadSelectMenus();
    await loadModals();
    await loadEvents(client);

    client.once(Events.ClientReady, () => {
        void (async (): Promise<void> => {
            Logger.debug('Client is ready. Registering commands...');
            await registerCommands();
            Logger.debug('Commands registered successfully');
            await createServer({
                port: parseInt(process.env.MS_PORT ?? process.env.PORT ?? '3000'),
                routesPath: join(__dirname, '..', 'routes'),
            });
        })();
    });

    await client.login(process.env.MS_DISCORD_TOKEN).catch((error: Error) => {
        console.error('Failed to login:', error);
        process.exit(1);
    });
}

// Start the bot
void startBot();
