import { StringSelectMenuInteraction } from "discord.js";
import { InteractionEvent } from "./InteractionEvent";

class StringSelectInteractionEvent implements InteractionEvent<StringSelectMenuInteraction> {

    async execute(interaction: StringSelectMenuInteraction, executionId: string) {
        console.log("Executing SelectInteraction");
        console.log(executionId, interaction.customId, interaction.values);
    }
}

export { StringSelectInteractionEvent };