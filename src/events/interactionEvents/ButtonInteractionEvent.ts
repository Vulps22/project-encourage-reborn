import { ButtonInteraction } from "discord.js";
import { InteractionEvent } from "./InteractionEvent";
import { Handler, Logger } from "../../utils";
import { BotButtonInteraction } from "../../structures";

class ButtonInteractionEvent implements InteractionEvent<ButtonInteraction> {
    async execute(interaction: ButtonInteraction, executionId: string): Promise<void> {
        const botInteraction = new BotButtonInteraction(interaction, executionId)
        const button: Handler<BotButtonInteraction> | undefined = global.buttons.get(botInteraction.baseId);
        if(!button) {
            Logger.error(`Button not found for Custom ID: ${botInteraction.baseId}`);
            return;
        }
        try {
            await button.execute(botInteraction);
            await Logger.updateExecution(executionId, 'Success');
        } catch (error) {
            console.error('Button execution error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            await Logger.updateExecution(executionId, `Failed: ${errorMessage}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred while processing this action.', ephemeral: true });
            }
        }
    }
}

export { ButtonInteractionEvent };