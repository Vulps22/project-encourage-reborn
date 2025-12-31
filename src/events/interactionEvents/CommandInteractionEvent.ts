import { ChatInputCommandInteraction } from "discord.js";
import { BotCommandInteraction } from "../../structures";
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

        if(command.isAdministrator && !botInteraction.isAdministrator()) {
            await botInteraction.sendReply('❌ You do not have permission to use this command.');
            await Logger.updateExecution(executionId, 'Failed: Permission denied');
            return;
        }

        try {
            await Logger.updateExecution(executionId, 'Executing');
            await command.execute(botInteraction);
            await Logger.updateExecution(executionId, 'Success');
        } catch (error) {
            console.error('Command execution error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            await Logger.updateExecution(executionId, `Failed: ${errorMessage}`);
            
            // Try to send error message to user if interaction hasn't been responded to
            if (!interaction.replied && !interaction.deferred) {
                await botInteraction.sendReply('❌ An error occurred while processing your command.');
            }
        }
    }
}