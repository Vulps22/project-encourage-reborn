import { ButtonInteraction, InteractionUpdateOptions, StringSelectMenuInteraction } from 'discord.js';
import { BotRepliableInteraction } from './BotRepliableInteraction';

/**
 * BotComponentInteraction - Abstract base class for message component interactions
 * (buttons, select menus, etc.)
 * Adds component-specific properties and methods (customId, update)
 */
export abstract class BotComponentInteraction extends BotRepliableInteraction {
  protected declare readonly _interaction: ButtonInteraction | StringSelectMenuInteraction;

  constructor(interaction: ButtonInteraction | StringSelectMenuInteraction, executionId: string) {
    super(interaction, executionId);
    this._interaction = interaction;
  }

  // --- COMPONENT-SPECIFIC PROPERTIES ---
  get customId() { return this._interaction.customId; }
  get message() { return this._interaction.message; }

  // --- COMPONENT-SPECIFIC METHODS ---
  update(options: string | InteractionUpdateOptions) {
    return this._interaction.update(options);
  }

  updateComponentMessage(content: string | null, options?: any) {
        const updateOptions = { ...options };
    if (content && content.length > 0) {
      updateOptions.content = content;
    }

    return this._interaction.update(updateOptions);
  }
}
