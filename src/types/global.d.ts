import { Client, Collection } from 'discord.js';
import { Command } from '../utils';

declare global {
    var client: Client;
    var commands: Collection<string, Command>;
}

export {};
