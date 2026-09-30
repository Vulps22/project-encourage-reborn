import { Interaction } from 'discord.js';
import { EventHandler } from '../types';
import { Logger } from '../utils';
import {
  CommandInteractionEvent,
  ButtonInteractionEvent,
  ModalInteractionEvent,
  StringSelectInteractionEvent,
} from './interactionEvents';
import { ChannelSelectInteractionEvent } from './interactionEvents/ChannelSelectInteractionEvent';

/**
 * InteractionCreate event handler
 * Dispatches incoming interactions to the appropriate handler collection.
 * Service-layer checks (user bans, server bans, tracking) are intentionally
 * absent here — this bot is webhook-driven and moderation-focused.
 */
const interactionCreate: EventHandler<'interactionCreate'> = {
  event: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction): Promise<void> => {
    const typeLabel = interaction.isChatInputCommand()
      ? `Command: /${interaction.commandName}`
      : interaction.isButton()
      ? `Button: ${interaction.customId.split('_')[1] ?? interaction.customId}`
      : interaction.isModalSubmit()
      ? `Modal: ${interaction.customId.split('_')[1] ?? interaction.customId}`
      : interaction.isStringSelectMenu() || interaction.isChannelSelectMenu()
      ? `Select: ${interaction.customId.split('_')[1] ?? interaction.customId}`
      : interaction.isAutocomplete()
      ? `Autocomplete: /${interaction.commandName}`
      : 'Interaction';

    // Fire-and-forget — see the matching comment in bot-service. Awaiting the log
    // webhook put a Discord round-trip in front of every interaction; the returned
    // message id existed only for the status edits, which are gone.
    void Logger.logInteractionReceived(interaction, typeLabel);
    const executionId = '';

    if (interaction.isAutocomplete()) {
      void new CommandInteractionEvent().autocomplete?.(interaction);
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
