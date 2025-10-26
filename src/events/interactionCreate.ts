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

        command.execute(botInteraction)
        return;

    }
  },
};

export default interactionCreate;