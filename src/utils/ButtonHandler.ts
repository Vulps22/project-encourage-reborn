import { BotButtonInteraction } from '../structures';

/**
 * ButtonHandler type for defining button interaction handlers
 */
export type ButtonHandler = {
    name: string;
    execute: (interaction: BotButtonInteraction) => Promise<void>;
};