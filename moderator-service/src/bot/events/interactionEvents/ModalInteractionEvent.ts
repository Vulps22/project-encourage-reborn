import { MessageFlags, ModalSubmitInteraction } from 'discord.js';
import { InteractionEvent } from './InteractionEvent';
import { Handler, Logger } from '../../utils';
import { BotModalInteraction } from '@vulps22/bot-interactions';

class ModalInteractionEvent implements InteractionEvent<ModalSubmitInteraction> {
    async execute(interaction: ModalSubmitInteraction, executionId: string): Promise<void> {
        const botInteraction = new BotModalInteraction(interaction, executionId);
        const handler: Handler<BotModalInteraction> | undefined = global.modals.get(botInteraction.baseId);
        if (!handler) {
            Logger.error(`Modal handler not found for Custom ID: ${botInteraction.baseId}`);
            return;
        }
        try {
            await handler.execute(botInteraction);
            await Logger.updateExecution(executionId, 'Success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`Modal execution error (${botInteraction.baseId}): ${errorMessage}`);
            await Logger.updateExecution(executionId, `Failed: ${errorMessage}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred while processing this action.', flags: MessageFlags.Ephemeral }).catch(() => null);
            }
        }
    }
}

export { ModalInteractionEvent };
