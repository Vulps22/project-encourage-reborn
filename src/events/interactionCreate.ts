import { Interaction } from 'discord.js';
import { EventHandler } from '../types';
import { Logger } from '../utils';
import { BotCommandInteraction } from '../structures';

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
        const command = global.commands.get(interaction.commandName);
        if (!command) {
            Logger.error(`No command found for name: ${interaction.commandName}`);
            return;
        }

        const botInteraction = new BotCommandInteraction(interaction, executionId);

        if(command.isAdministrator && !botInteraction.isAdministrator()) {
            await botInteraction.sendReply('❌ You do not have permission to use this command.');
            await Logger.updateExecution(executionId, 'Failed: Permission denied');
            return;
        }

        try {
            await Logger.updateExecution(executionId, 'Executing');
            await command.execute(botInteraction);
            await Logger.updateExecution(executionId, 'Success');
        } catch (error) {
            console.error('Command execution error:', error);
            await Logger.updateExecution(executionId, `Failed: ${error}`);
            
            // Try to send error message to user if interaction hasn't been responded to
            if (!interaction.replied && !interaction.deferred) {
                await botInteraction.sendReply('❌ An error occurred while processing your command.');
            }
        }

        return;

    }
  },
};

export default interactionCreate;