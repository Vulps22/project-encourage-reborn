import { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import { BotCommandInteraction } from "@vulps22/bot-interactions";
import { Logger } from "../../utils";
import { InteractionEvent } from "./InteractionEvent";

export class CommandInteractionEvent implements InteractionEvent<ChatInputCommandInteraction> {


    async execute(interaction: ChatInputCommandInteraction, executionId: string): Promise<void> {
        const command = global.commands.get(interaction.commandName);
        if (!command) {
            Logger.error(`No command found for name: ${interaction.commandName}`);
            return;
        }

        const botInteraction = new BotCommandInteraction(interaction, executionId);

        if (command.isAdministrator && !botInteraction.isAdministrator()) {
            await botInteraction.sendReply('❌ You do not have permission to use this command.');
            Logger.updateExecution(executionId, 'Failed: Permission denied');
            return;
        }

        try {
            Logger.updateExecution(executionId, 'Executing');
            await command.execute(botInteraction);
            Logger.updateExecution(executionId, 'Success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`Command execution error (${interaction.commandName}): ${errorMessage}`);
            Logger.updateExecution(executionId, `Failed: ${errorMessage}`);

            if (!interaction.replied && !interaction.deferred) {
                await botInteraction.sendReply('❌ An error occurred while processing your command.').catch(() => null);
            }
        }
    }

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const command = global.commands.get(interaction.commandName);
        if (!command) {
            Logger.error(`No command found for name: ${interaction.commandName} to Autocomplete`);
            return;
        }

        try {
            await command.autoComplete(interaction);
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    }
}