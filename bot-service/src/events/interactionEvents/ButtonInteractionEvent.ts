import { ButtonInteraction, MessageFlags } from "discord.js";
import { InteractionEvent } from "./InteractionEvent";
import { Handler } from "../../utils";
import { Logger } from "@vulps22/logger";
import { BotButtonInteraction } from "@vulps22/bot-interactions";
import { analyticsService } from "../../services";

class ButtonInteractionEvent implements InteractionEvent<ButtonInteraction> {
    async execute(interaction: ButtonInteraction, executionId: string): Promise<void> {
        const botInteraction = new BotButtonInteraction(interaction, executionId)
        const button: Handler<BotButtonInteraction> | undefined = global.buttons.get(botInteraction.baseId);
        if(!button) {
            Logger.error(`Button not found for Custom ID: ${botInteraction.baseId}`);
            return;
        }

        analyticsService.logEvent('button', botInteraction.baseId, button.interactionInitiator, interaction.user.id, interaction.guildId);

        try {
            await button.execute(botInteraction);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`Button execution error (${botInteraction.baseId}): ${errorMessage}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred while processing this action.', flags: MessageFlags.Ephemeral }).catch(() => null);
            }
        }
    }
}

export { ButtonInteractionEvent };