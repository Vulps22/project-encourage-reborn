import { PermissionFlagsBits } from 'discord.js';
import { serverService } from '../../../services';
import { BotCommandInteraction, errorView } from '@vulps22/bot-interactions';
import { Command } from '../../../utils';
import { termsView } from '../../../views';

const setup = new Command('setup', 'Configure server settings (Admin only)')
  .setNSFW(false)
  .setAdministrator(false) // We'll check permissions manually for better UX
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    // Check if user has admin permissions
    const member = interaction.member;
    if (!member || !('permissions' in member)) {
      await interaction.ephemeralReply(errorView('You need Administrator or Manage Server permissions to run this command.'));
      return;
    }

    const permissions = member.permissions as import('discord.js').PermissionsBitField;
    if (!permissions.has(PermissionFlagsBits.Administrator) &&
        !permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.ephemeralReply(errorView('You need Administrator or Manage Server permissions to run this command.'));
      return;
    }

    // Defer reply since we'll have multi-step interaction and potential IPC calls later
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const guild = interaction.guild;

    if (!guildId || !guild) {
      await interaction.sendReply(errorView('This command can only be used in a server.'));
      return;
    }

    // Get or create server record
    await serverService.getOrCreateServer(
      guildId,
      guild.name,
      guild.ownerId
    );

    // Show terms view to start the setup wizard
    const message = termsView();
    await interaction.sendReply(message);
  });

export default setup;
