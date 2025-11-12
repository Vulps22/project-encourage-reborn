import { ButtonInteraction } from "discord.js";
import { InteractionEvent } from "./InteractionEvent";
import { ButtonHandler, Logger } from "../../utils";
import { BotButtonInteraction } from "../../structures";

class ButtonInteractionEvent implements InteractionEvent<ButtonInteraction> {
    async execute(interaction: ButtonInteraction, executionId: string) {
        const botInteraction = new BotButtonInteraction(interaction, executionId)
        const button: ButtonHandler | undefined = global.buttons.get(botInteraction.baseId);
        if(!button) {
            Logger.error(`Button not found for Custom ID: ${botInteraction.baseId}`);
            return;
        }
        console.log(`Button Found:`, button.name, `| Execution ID:`, executionId);
        await button.execute(botInteraction);
    }
}

export { ButtonInteractionEvent };