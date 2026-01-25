import { AutocompleteInteraction, Interaction } from "discord.js";

export interface InteractionEvent<T extends Interaction = Interaction> {
    /**
     * Executes the interaction event.
     * @returns false if the interaction's identifier (commandName, or customID) did not exist
     */
    execute(interaction: T, executionId: string): Promise<void>;

    /**
     * Handles autocomplete interactions (optional - only for command interactions)
     */
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}