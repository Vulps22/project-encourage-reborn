import { GuildTextBasedChannel, Interaction, MessageCreateOptions, MessageFlags } from 'discord.js';
import { DMInteractionError } from '../errors';
import { moderationService, serverService, userService, userTrackingService } from '../services';
import { EventHandler, TargetType } from '../types';
import { Logger } from '../utils';
import { CommandInteractionEvent, ButtonInteractionEvent, ModalInteractionEvent, StringSelectInteractionEvent } from './interactionEvents';
import { ChannelSelectInteractionEvent } from './interactionEvents/ChannelSelectInteractionEvent';
import { playtestNoticeView } from '../views/playtestNoticeView';

/**
 * InteractionCreate event handler
 * Handles all Discord interactions (commands, buttons, select menus)
 */
const interactionCreate: EventHandler<'interactionCreate'> = {
  event: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction): Promise<void> => {
    const executionId = await Logger.logInteractionReceived(interaction);

    // Track user interaction before processing
    try {
      await userTrackingService.trackInteraction(interaction);
    } catch (error) {
      if (error instanceof DMInteractionError) {
        // DM interactions are not supported - reply and exit
        if (interaction.isRepliable()) {
          await interaction.reply({
            content: error.message,
            flags: MessageFlags.Ephemeral
          });
        }
        await Logger.updateExecution(executionId, 'Failed: DM interaction not supported');
        return;
      }
      // Other errors are critical - block the interaction
      Logger.error(`User tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await Logger.updateExecution(executionId, `Failed: Tracking error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: 'An error occurred while processing your request. Please try again later.',
          flags: MessageFlags.Ephemeral
        });
      }
      return;
    }


    if(interaction.isAutocomplete()) {
      if(await serverService.isServerBanned(interaction.guildId || '')) {
        await interaction.respond([{ name: 'This server is banned from using the bot.', value: '' }]);
        return;
      }
      void new CommandInteractionEvent().autocomplete?.(interaction);
      return;
    }

    const banReason = await serverService.isServerBanned(interaction.guildId || '');

    if (banReason) {
      await interaction.reply({
        content: `This server is banned from using the bot. Reason: ${moderationService.getBanReasonLabel(TargetType.Server, banReason)}`
      })
      return;
    }

    const userBanReason = await userService.isUserBanned(interaction.user.id);
    if (userBanReason) {
      await interaction.reply({
        content: `You are banned from using this bot. Reason: ${moderationService.getBanReasonLabel(TargetType.User, userBanReason)}`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Send playtest notice on the server's first interaction
    if (interaction.guildId && interaction.channel) {
      const server = await serverService.getServerSettings(interaction.guildId);
      if (server && !server.playtest_notified) {
        await (interaction.channel as GuildTextBasedChannel).send(playtestNoticeView() as MessageCreateOptions);
        await serverService.markPlaytestNotified(interaction.guildId);
      }
    }

    if (interaction.isChatInputCommand()) {
      void new CommandInteractionEvent().execute(interaction, executionId);
      return;
    }

    if (interaction.isModalSubmit()) {
      void new ModalInteractionEvent().execute(interaction, executionId);
      return;
    }

    if (interaction.isButton()) {
      void new ButtonInteractionEvent().execute(interaction, executionId);
      return;
    }
    if (interaction.isStringSelectMenu()) {
      void new StringSelectInteractionEvent().execute(interaction, executionId);
      return;
    }
    if(interaction.isChannelSelectMenu()){
      void new ChannelSelectInteractionEvent().execute(interaction, executionId);
      return;
    }

  },
};

export default interactionCreate;