import { StringSelectMenuInteraction } from 'discord.js';
import { BotComponentInteraction } from './BotComponentInteraction';

/**
 * BotSelectMenuInteraction - Wrapper for Discord select menu interactions
 * Adds select menu-specific properties like values and parsed customId params
 */
export class BotSelectMenuInteraction extends BotComponentInteraction {
  protected readonly _interaction: StringSelectMenuInteraction;
  private readonly _params: Map<string, string>;
  private readonly _baseId: string;
  private readonly _action: string;

  constructor(interaction: StringSelectMenuInteraction, executionId: string) {
    super(interaction, executionId);
    this._interaction = interaction;
    
    // Parse customId format: prefix_action_key:value_key:value
    const { baseId, action, params } = this._parseCustomId(interaction.customId);
    this._baseId = baseId;
    this._action = action;
    this._params = params;
  }

  // --- SELECT MENU-SPECIFIC PROPERTIES ---
  get values() { return this._interaction.values; }
  get baseId() { return this._baseId; }
  get action() { return this._action; }
  get params() { return this._params; }

  // --- PRIVATE HELPER ---
  private _parseCustomId(customId: string): { baseId: string; action: string; params: Map<string, string> } {
    const params = new Map<string, string>();
    
    // Split by underscore to get parts
    const parts = customId.split('_');
    
    if (parts.length < 2) {
      return { baseId: customId, action: '', params };
    }

    const prefix = parts[0];
    const action = parts[1];
    const baseId = `${prefix}_${action}`;

    // Parse remaining parts as key:value pairs
    for (let i = 2; i < parts.length; i++) {
      const [key, value] = parts[i].split(':');
      if (key && value) {
        params.set(key, value);
      }
    }

    return { baseId, action, params };
  }
}
