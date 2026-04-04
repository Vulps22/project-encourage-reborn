import { ChannelSelectMenuInteraction, MessageFlags } from "discord.js";
import { InteractionEvent } from "./InteractionEvent";
import { BotSelectMenuInteraction } from "../../structures";
import { Handler, Logger } from "../../utils";

class ChannelSelectInteractionEvent implements InteractionEvent<ChannelSelectMenuInteraction> {

    async execute(interaction: ChannelSelectMenuInteraction, executionId: string): Promise<void> {
        const botSelectInteraction = new BotSelectMenuInteraction(interaction, executionId);
        const selectHandler: Handler<BotSelectMenuInteraction> | undefined = global.selects.get(botSelectInteraction.baseId);
        if (!selectHandler) {
            Logger.error(`SelectMenu not found for Custom ID: ${botSelectInteraction.baseId}`);
            return;
        }
        try {
            await selectHandler.execute(botSelectInteraction);
            await Logger.updateExecution(executionId, 'Success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`ChannelSelect execution error (${botSelectInteraction.baseId}): ${errorMessage}`);
            await Logger.updateExecution(executionId, `Failed: ${errorMessage}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred while processing this action.', flags: MessageFlags.Ephemeral }).catch(() => null);
            }
        }
    }
}

export { ChannelSelectInteractionEvent };