import { ButtonInteraction, InteractionUpdateOptions, MessageFlags } from 'discord.js';
import { BotRepliableInteraction } from './BotRepliableInteraction';
import { AnySelectMenuInteraction } from '../types';

/**
 * BotComponentInteraction - Abstract base class for message component interactions
 * (buttons, select menus, etc.)
 * Adds component-specific properties and methods (customId, update)
 * @deprecated Use Vulps22/bot-interactions package instead
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
    const isV2 = options?.flags && (options.flags & MessageFlags.IsComponentsV2);
    console.debug('[updateComponentMessage] content:', content);
    console.debug('[updateComponentMessage] flags:', options?.flags, '| isV2:', !!isV2);
    console.debug('[updateComponentMessage] options keys:', options ? Object.keys(options) : 'undefined');
    console.debug('[updateComponentMessage] deferred:', this._interaction.deferred, '| replied:', this._interaction.replied);

    // Components V2 messages must be edited via the channel message endpoint —
    // Discord.js's interaction editReply/update payload builder injects a content
    // field which Discord rejects for IS_COMPONENTS_V2 messages.
    if (isV2) {
      console.debug('[updateComponentMessage] routing to message.edit() for V2');
      return this.message.edit({ flags: options.flags, components: options.components });
    }

    const updateOptions = { ...options };
    if (content && content.length > 0) {
      updateOptions.content = content;
    }

    console.debug('[updateComponentMessage] routing to update(), updateOptions keys:', Object.keys(updateOptions));
    return this.update(updateOptions);
  }

}
