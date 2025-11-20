import { Client, Collection } from 'discord.js';
import { Handler, Command } from '../utils';
import { Config } from '../config';
import { BotSelectMenuInteraction } from '../structures';

declare global {
    var client: Client;
    var commands: Collection<string, Command>;
    var buttons: Collection<string, Handler<BotButtonInteraction>>;
    var selects: Collection<string, Handler<BotSelectMenuInteraction>>;
    var config: typeof Config;
}

export {};
