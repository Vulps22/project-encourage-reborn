import { PermissionFlagsBits } from 'discord.js';
import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { channelSelectView } from '../../../views';

const declineRulesButton: Handler<BotButtonInteraction> = {
    name: 'declineRules',
    params: {},
    async execute(interaction) {
        // Verify user is admin
        if (!interaction.interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) &&
            !interaction.interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators can decline rules for this server.');
            return;
        }

        const guildId = interaction.interaction.guildId;
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
