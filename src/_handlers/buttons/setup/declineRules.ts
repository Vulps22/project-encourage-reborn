import { PermissionFlagsBits } from 'discord.js';
import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { channelSelectView } from '../../../views';

const declineRulesButton: Handler<BotButtonInteraction> = {
    name: 'declineRules',
    params: {},
    async execute(interaction) {
        // Verify user is admin
        if (!member.permissions?.has(PermissionFlagsBits.Administrator) &&
            !member.permissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators can decline rules for this server.');
            return;
        }

        const member = interaction.member;
        if (!member || !('permissions' in member)) {
            await interaction.ephemeralReply('❌ Only administrators can');
            return;
        }

        const permissions = member.permissions as import('discord.js').PermissionsBitField;
        if (!permissions.has(PermissionFlagsBits.Administrator) &&
            !permissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators');
            return;
        }

        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.ephemeralReply('❌ This can only be used in a server.');
            return;
        }

        // Note: can_create remains false (default)
        // Server can still use the bot, just can't create questions

        // Proceed to channel selection step anyway
        const message = channelSelectView();
        await interaction.sendReply(null, message);
    }
};

export default declineRulesButton;
