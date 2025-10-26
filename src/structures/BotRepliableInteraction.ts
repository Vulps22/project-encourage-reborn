import { ChatInputCommandInteraction, ButtonInteraction, StringSelectMenuInteraction, InteractionEditReplyOptions, InteractionReplyOptions, MessageFlags } from 'discord.js';
import { BotInteraction } from './BotInteraction';

/**
 * BotRepliableInteraction - Abstract base class for interactions that can be replied to
 * Includes slash commands and message components (buttons, select menus)
 */
export abstract class BotRepliableInteraction extends BotInteraction {
  protected declare readonly _interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction;

  constructor(interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction, executionId: string) {
    super(interaction, executionId);
    this._interaction = interaction;
  }

  // --- REPLIABLE PROPERTIES ---
  get deferred() { return this._interaction.deferred; }
  get replied() { return this._interaction.replied; }

  // --- REPLIABLE METHODS ---
  reply(options: InteractionReplyOptions) {
    return this._interaction.reply(options);
  }

  editReply(options: string | InteractionEditReplyOptions) {
    return this._interaction.editReply(options);
  }

  deferReply(options?: { ephemeral?: boolean; flags?: number }) {
    return this._interaction.deferReply(options);
  }

  async sendReply(content: string, options: InteractionReplyOptions = {}): Promise<void> {
    const replyOptions: InteractionReplyOptions = { ...options };
    if (content && content.length > 0) {
      replyOptions.content = content;
    }

    if (this.deferred || this.replied) {
      await this.editReply(replyOptions as InteractionEditReplyOptions);
    } else {
      await this.reply(replyOptions);
    }
  }

  async ephemeralReply(content: string, options: InteractionReplyOptions = {}): Promise<void> {
    const existingFlags = Number(options.flags) || 0;
    const combinedFlags = existingFlags | MessageFlags.Ephemeral;
    const finalOptions: InteractionReplyOptions = { ...options, flags: combinedFlags };

    return this.sendReply(content, finalOptions);
  }
}
