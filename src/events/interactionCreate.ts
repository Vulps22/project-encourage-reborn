import { Interaction } from 'discord.js';
import { EventHandler } from '../types';
import { Logger } from '../utils';
import { CommandInteractionEvent, ButtonInteractionEvent } from './interactionEvents';

/**
 * InteractionCreate event handler
 * Handles all Discord interactions (commands, buttons, select menus)
 */
const interactionCreate: EventHandler<'interactionCreate'> = {
  event: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction): Promise<void> => {
    const executionId = await Logger.logInteractionReceived(interaction);

    if(interaction.isChatInputCommand()) {
        new CommandInteractionEvent().execute(interaction, executionId);
        return;
    }

    if(interaction.isButton()) {
        new ButtonInteractionEvent().execute(interaction, executionId);
        return;
    }

  },
};

export default interactionCreate;