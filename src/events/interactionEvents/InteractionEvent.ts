import { Interaction } from "discord.js";

export interface InteractionEvent<T extends Interaction = Interaction> {
    execute(interaction: T, executionId: string): Promise<void>;
}