import { Interaction } from "discord.js";

export interface InteractionEvent<T extends Interaction = Interaction> {
    /**
     * Executes the interaction event.
     * @returns false if the interaction's identifier (commandName, or customID) did not exist
     */
    execute(interaction: T, executionId: string): Promise<void>;
}