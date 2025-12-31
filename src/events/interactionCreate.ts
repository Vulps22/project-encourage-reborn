import { Interaction, MessageFlags } from 'discord.js';
import { DMInteractionError } from '../errors';
import { userTrackingService } from '../services';
import { EventHandler } from '../types';
import { Logger } from '../utils';
import { CommandInteractionEvent, ButtonInteractionEvent, StringSelectInteractionEvent } from './interactionEvents';

/**
 * InteractionCreate event handler
 * Handles all Discord interactions (commands, buttons, select menus)
 */
const interactionCreate: EventHandler<'interactionCreate'> = {
  event: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction): Promise<void> => {
    const executionId = await Logger.logInteractionReceived(interaction);

    // Track user interaction before processing
    try {
      await userTrackingService.trackInteraction(interaction);
    } catch (error) {
      if (error instanceof DMInteractionError) {
        // DM interactions are not supported - reply and exit
        if (interaction.isRepliable()) {
          await interaction.reply({
            content: error.message,
            flags: MessageFlags.Ephemeral
          });
        }
        await Logger.updateExecution(executionId, 'Failed: DM interaction not supported');
        return;
      }
      // Other errors are critical - block the interaction
      Logger.error(`User tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await Logger.updateExecution(executionId, `Failed: Tracking error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: 'An error occurred while processing your request. Please try again later.',
          flags: MessageFlags.Ephemeral
        });
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      new CommandInteractionEvent().execute(interaction, executionId);
      return;
    }

    if (interaction.isButton()) {
      new ButtonInteractionEvent().execute(interaction, executionId);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      new StringSelectInteractionEvent().execute(interaction, executionId);
      return;
    }
  },
};

export default interactionCreate;