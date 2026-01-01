import { PermissionFlagsBits } from 'discord.js';
import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const declineTermsButton: Handler<BotButtonInteraction> = {
    name: 'declineTerms',
    params: {},
    async execute(interaction) {
        // Verify user is admin
        if (!interaction.interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) &&
            !interaction.interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators can decline terms for this server.');
            return;
        }

        const guild = interaction.interaction.guild;
        if (!guild) {
            await interaction.ephemeralReply('❌ This can only be used in a server.');
            return;
        }

        // Send farewell message
        await interaction.sendReply(
            '👋 Terms declined. The bot will now leave this server. You can re-add the bot at any time if you change your mind.',
            null
        );

        // Leave the server
        await guild.leave();
    }
};

export default declineTermsButton;
