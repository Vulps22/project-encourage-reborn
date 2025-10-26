import { ChatInputCommandInteraction } from 'discord.js';
import { BotRepliableInteraction } from './BotRepliableInteraction';

/**
 * BotCommandInteraction - Wrapper for Discord slash command interactions
 * Adds command-specific properties (options, commandName)
 */
export class BotCommandInteraction extends BotRepliableInteraction {
  protected readonly _interaction: ChatInputCommandInteraction;

  constructor(interaction: ChatInputCommandInteraction, executionId: string) {
    super(interaction, executionId);
    this._interaction = interaction;
  }

  // --- COMMAND-SPECIFIC PROPERTIES ---
  get options() { return this._interaction.options; }
  get commandName() { return this._interaction.commandName; }
}
