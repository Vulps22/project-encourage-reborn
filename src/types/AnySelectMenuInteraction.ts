import { ChannelSelectMenuInteraction, MentionableSelectMenuInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, UserSelectMenuInteraction } from 'discord.js';

/**
 * Union type for all Discord.js select menu interaction types
 * @deprecated Use Vulps22/bot-interactions package instead
 */
export type AnySelectMenuInteraction = 
  | StringSelectMenuInteraction 
  | UserSelectMenuInteraction 
  | RoleSelectMenuInteraction 
  | MentionableSelectMenuInteraction 
  | ChannelSelectMenuInteraction;
