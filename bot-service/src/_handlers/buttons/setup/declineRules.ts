import { PermissionFlagsBits } from 'discord.js';
import { BotButtonInteraction, errorView } from '@vulps22/bot-interactions';
import { Handler } from '../../../utils';
import { channelSelectView } from '../../../views';

const declineRulesButton: Handler<BotButtonInteraction> = {
    name: 'declineRules',
    params: {},
    interactionInitiator: false,
    async execute(interaction) {
        // Verify user is admin
        const member = interaction.member;
        if (!member || !('permissions' in member)) {
            await interaction.ephemeralReply(errorView('Only administrators can decline rules for this server.'));
            return;
        }

        const permissions = member.permissions;
        if (typeof permissions === 'string') {
            await interaction.ephemeralReply(errorView('Only administrators can decline rules for this server.'));
            return;
        }

        if (!permissions.has(PermissionFlagsBits.Administrator) &&
            !permissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply(errorView('Only administrators can decline rules for this server.'));
            return;
        }

        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.ephemeralReply(errorView('This can only be used in a server.'));
            return;
        }

        // Note: can_create remains false (default)
        // Server can still use the bot, just can't create questions

        // Proceed to channel selection step anyway
        const message = channelSelectView();
        await interaction.sendReply(message);
    }
};

export default declineRulesButton;
