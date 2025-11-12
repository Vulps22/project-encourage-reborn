import { Client, Collection } from 'discord.js';
import { Command } from '../utils';
import { Config } from '../config';

declare global {
    var client: Client;
    var commands: Collection<string, Command>;
    var config: typeof Config;
}

export {};
