import { ClientEvents } from 'discord.js';

/**
 * Event handler structure for automatic registration
 */
export interface EventHandler<K extends keyof ClientEvents = keyof ClientEvents> {
  event: K;
  once: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
}
