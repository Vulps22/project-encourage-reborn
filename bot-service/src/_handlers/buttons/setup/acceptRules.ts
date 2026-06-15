import { PermissionFlagsBits } from 'discord.js';
import { serverService } from '../../../services';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import { Handler } from '../../../utils';
import { channelSelectView } from '../../../views';

const acceptRulesButton: Handler<BotButtonInteraction> = {
    name: 'acceptRules',
    params: {},
    async execute(interaction) {
        // Verify user is admin
        const member = interaction.member;
        if (!member || !('permissions' in member)) {
            await interaction.ephemeralReply('❌ Only administrators can accept rules for this server.');
            return;
        }

        const permissions = member.permissions;
        if (typeof permissions === 'string') {
            await interaction.ephemeralReply('❌ Only administrators can accept rules for this server.');
            return;
        }

        if (!permissions.has(PermissionFlagsBits.Administrator) &&
            !permissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators can accept rules for this server.');
            return;
        }

        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.ephemeralReply('❌ This can only be used in a server.');
            return;
        }

        // Block if server is banned
        const banReason = await serverService.isServerBanned(guildId);
        if (banReason) {
            await interaction.ephemeralReply(`❌ This server is banned from using the bot. Reason: ${banReason}`);
            return;
        }

        // Mark rules as accepted and grant can_create permission
        await serverService.acceptRules(guildId);

        // Proceed to channel selection step
        const message = channelSelectView();
        await interaction.sendReply(null, message);
    }
};

export default acceptRulesButton;
