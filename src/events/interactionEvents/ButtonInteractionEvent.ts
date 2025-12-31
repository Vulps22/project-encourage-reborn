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
        await button.execute(botInteraction);
    }
}

export { ButtonInteractionEvent };