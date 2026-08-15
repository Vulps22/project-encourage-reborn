import { AutocompleteInteraction, ChatInputCommandInteraction, GuildNSFWLevel, TextChannel } from "discord.js";
import { BotCommandInteraction, errorView } from "@vulps22/bot-interactions";
import { Logger } from "@vulps22/logger";
import { InteractionEvent } from "./InteractionEvent";
import { analyticsService } from "../../services";

export class CommandInteractionEvent implements InteractionEvent<ChatInputCommandInteraction> {


    async execute(interaction: ChatInputCommandInteraction, executionId: string): Promise<void> {
        const command = global.commands.get(interaction.commandName);
        if (!command) {
            Logger.error(`No command found for name: ${interaction.commandName}`);
            return;
        }

        const channel = interaction.channel as TextChannel;
        const botInteraction = new BotCommandInteraction(interaction, executionId);

        analyticsService.logEvent('command', command.name, command.interactionInitiator, interaction.user.id, interaction.guildId);

        const guildIsNSFW = interaction.guild?.nsfwLevel !== GuildNSFWLevel.Safe
                 && interaction.guild?.nsfwLevel !== GuildNSFWLevel.Default;

        if (command.isNSFW && !channel.nsfw && !guildIsNSFW) {
            await botInteraction.sendReply(errorView('This command can only be used in NSFW channels or servers.'));
            return;
        }

        if (command.isAdministrator && !botInteraction.isAdministrator()) {
            await botInteraction.sendReply(errorView('You do not have permission to use this command.'));
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
                await botInteraction.sendReply(errorView('An error occurred while processing your command.')).catch(() => null);
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