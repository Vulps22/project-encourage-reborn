import { ModalSubmitInteraction } from 'discord.js';
import { BotRepliableInteraction } from './BotRepliableInteraction';

/**
 * BotModalInteraction - Wrapper for Discord modal submit interactions
 * Adds modal-specific properties like fields and parsed customId params
 */
export class BotModalInteraction extends BotRepliableInteraction {
  protected readonly _interaction: ModalSubmitInteraction;
  private readonly _params: Map<string, string>;
  private readonly _baseId: string;

  constructor(interaction: ModalSubmitInteraction, executionId: string) {
    super(interaction, executionId);
    this._interaction = interaction;

    const { baseId, params } = this._parseCustomId(interaction.customId);
    this._baseId = baseId;
    this._params = params;
  }

  // --- MODAL-SPECIFIC PROPERTIES ---
  get customId() { return this._interaction.customId; }
  get baseId() { return this._baseId; }
  get params() { return this._params; }
  get fields() { return this._interaction.fields; }

  // --- PRIVATE HELPER ---
  private _parseCustomId(customId: string): { baseId: string; params: Map<string, string> } {
    const params = new Map<string, string>();
    const parts = customId.split('_');

    if (parts.length < 2) {
      return { baseId: customId, params };
    }

    const prefix = parts[0];
    const action = parts[1];
    const baseId = `${prefix}_${action}`;

    for (let i = 2; i < parts.length; i++) {
      const [key, value] = parts[i].split(':');
      if (key && value) {
        params.set(key, value);
      }
    }

    return { baseId, params };
  }
}
