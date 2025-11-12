import { ButtonInteraction } from "discord.js";
import { InteractionEvent } from "./InteractionEvent";
import { ButtonHandler, Logger } from "../../utils";

class ButtonInteractionEvent implements InteractionEvent<ButtonInteraction> {
    async execute(interaction: ButtonInteraction, executionId: string) {
        const button: ButtonHandler | undefined = global.buttons.get(interaction.customId);
        if(!button) {
            Logger.error(`Button not found for Custom ID: ${interaction.customId}`);
            return;
        }
        console.log(`Button Found:`, button.name, `| Execution ID:`, executionId);
    }
}

export { ButtonInteractionEvent };