import { Interaction, MessageFlags } from 'discord.js';
import { DMInteractionError } from '../errors';
import { serverService, userService, userTrackingService } from '../services';
import { banReasons } from '../config';
import { EventHandler } from '../types';
import { TargetType } from '@vulps22/project-encourage-types';
import { Logger } from '@vulps22/logger';
import { CommandInteractionEvent, ButtonInteractionEvent, ModalInteractionEvent, StringSelectInteractionEvent } from './interactionEvents';
import { ChannelSelectInteractionEvent } from './interactionEvents/ChannelSelectInteractionEvent';

/**
 * InteractionCreate event handler
 * Handles all Discord interactions (commands, buttons, select menus)
 */
const interactionCreate: EventHandler<'interactionCreate'> = {
  event: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction): Promise<void> => {
    const typeLabel = interaction.isChatInputCommand() ? `Command: /${interaction.commandName}`
      : interaction.isButton() ? `Button: ${interaction.customId.split('_')[1] ?? interaction.customId}`
      : interaction.isModalSubmit() ? `Modal: ${interaction.customId.split('_')[1] ?? interaction.customId}`
      : interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() ? `Select: ${interaction.customId.split('_')[1] ?? interaction.customId}`
      : interaction.isAutocomplete() ? `Autocomplete: /${interaction.commandName}`
      : 'Interaction';

    // Fire-and-forget. Awaiting this put a Discord webhook round-trip in the path of
    // every interaction, on a rate-limited webhook shared by every shard, which was
    // consuming most of the 3s initial-response window. The returned message id was
    // only ever used to edit the message with a status afterwards; those updates are
    // gone, so nothing needs the id.
    void Logger.logInteractionReceived(interaction, typeLabel);
    const executionId = '';

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
        return;
      }
      // Other errors are critical - block the interaction
      Logger.error(`User tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

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

    // The server and user records are independent lookups, so fetch them together
    // rather than in series, and hand them to the ban checks so neither refetches.
    const [server, user] = await Promise.all([
      serverService.getServerSettings(interaction.guildId || ''),
      userService.getUser(interaction.user.id),
    ]);

    const banReason = await serverService.isServerBanned(interaction.guildId || '', server);

    if (banReason) {
      await interaction.reply({
        content: `This server is banned from using the bot. Reason: ${getBanReasonLabel(TargetType.Server, banReason)}`
      })
      return;
    }

    const userBanReason = await userService.isUserBanned(interaction.user.id, user);
    if (userBanReason) {
      await interaction.reply({
        content: `You are banned from using this bot. Reason: ${getBanReasonLabel(TargetType.User, userBanReason)}`,
        flags: MessageFlags.Ephemeral
      });
      return;
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

    if (interaction.isChannelSelectMenu()) {
      void new ChannelSelectInteractionEvent().execute(interaction, executionId);
      return;
    }

  },
};

export default interactionCreate;

function getBanReasonLabel(type: TargetType, value: string): string {
  const reasons = banReasons[type] as { label: string; value: string }[];
  const label = reasons.find(r => r.value === value)?.label ?? value;
  return label.replace(/^\d+ - /, '');
}