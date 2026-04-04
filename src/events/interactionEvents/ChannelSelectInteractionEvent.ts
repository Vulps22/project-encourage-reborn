import { ChannelSelectMenuInteraction } from "discord.js";
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
        await selectHandler.execute(botSelectInteraction);
    }
}

export { ChannelSelectInteractionEvent };