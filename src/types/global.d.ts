import { Client, Collection } from 'discord.js';
import { ButtonHandler, Command } from '../utils';
import { Config } from '../config';

declare global {
    var client: Client;
    var commands: Collection<string, Command>;
    var buttons: Collection<string, ButtonHandler>;
    var config: typeof Config;
}

export {};
