import { ButtonInteraction, InteractionUpdateOptions } from 'discord.js';
import { BotRepliableInteraction } from './BotRepliableInteraction';
import { AnySelectMenuInteraction } from '../types';

/**
 * BotComponentInteraction - Abstract base class for message component interactions
 * (buttons, select menus, etc.)
 * Adds component-specific properties and methods (customId, update)
 */
export abstract class BotComponentInteraction extends BotRepliableInteraction {
  protected declare readonly _interaction: ButtonInteraction | AnySelectMenuInteraction;

  constructor(interaction: ButtonInteraction | AnySelectMenuInteraction, executionId: string) {
    super(interaction, executionId);
    this._interaction = interaction;
  }

  // --- COMPONENT-SPECIFIC PROPERTIES ---
  get customId() { return this._interaction.customId; }
  get message() { return this._interaction.message; }

  // --- COMPONENT-SPECIFIC METHODS ---
  update(options: string | InteractionUpdateOptions) {
    if(this._interaction.deferred) {
      return this._interaction.editReply(options);
    }
    return this._interaction.update(options);
  }

  deferUpdate() {
    return this._interaction.deferUpdate();
  }

  updateComponentMessage(content: string | null, options?: any) {
        const updateOptions = { ...options };
    if (content && content.length > 0) {
      updateOptions.content = content;
    }

    return this.update(updateOptions);
  }

}
