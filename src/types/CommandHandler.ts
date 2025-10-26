import { AutocompleteInteraction, SlashCommandBuilder } from 'discord.js';
import { BotCommandInteraction } from '../structures';

/**
 * Command handler structure for automatic registration
 */
export interface CommandHandler {
  data: SlashCommandBuilder;
  isNSFW?: boolean;
  isAdministrator?: boolean;
  autoComplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  execute: (interaction: BotCommandInteraction) => Promise<void>;
}
