import { ButtonInteraction, MessageFlags } from "discord.js";
import { InteractionEvent } from "./InteractionEvent";
import { Handler, Logger } from "../../utils";
import { BotButtonInteraction } from "@vulps22/bot-interactions";

class ButtonInteractionEvent implements InteractionEvent<ButtonInteraction> {
    async execute(interaction: ButtonInteraction, executionId: string): Promise<void> {
        const botInteraction = new BotButtonInteraction(interaction, executionId);
        const button: Handler<BotButtonInteraction> | undefined = global.buttons.get(botInteraction.baseId);
        if(!button) {
            Logger.error(`Button not found for Custom ID: ${botInteraction.baseId}`);
            return;
        }
        try {
            await button.execute(botInteraction);
            Logger.updateExecution(executionId, 'Success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`Button execution error (${botInteraction.baseId}): ${errorMessage}`);
            Logger.updateExecution(executionId, `Failed: ${errorMessage}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred while processing this action.', flags: MessageFlags.Ephemeral }).catch(() => null);
            }
        }
    }
}

export { ButtonInteractionEvent };