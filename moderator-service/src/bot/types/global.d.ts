import { Client, Collection } from 'discord.js';
import { Handler, Command } from '../utils';
import { Config } from '../config';
import { BotButtonInteraction, BotModalInteraction, BotSelectMenuInteraction } from '@vulps22/bot-interactions';

declare global {
    var client: Client;
    var commands: Collection<string, Command>;
    var buttons: Collection<string, Handler<BotButtonInteraction>>;
    var selects: Collection<string, Handler<BotSelectMenuInteraction>>;
    var modals: Collection<string, Handler<BotModalInteraction>>;
    var config: typeof Config;
}

export {};
