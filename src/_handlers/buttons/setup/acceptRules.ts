import { PermissionFlagsBits } from 'discord.js';
import { serverService } from '../../../services';
import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { channelSelectView } from '../../../views';

const acceptRulesButton: Handler<BotButtonInteraction> = {
    name: 'acceptRules',
    params: {},
    async execute(interaction) {
        // Verify user is admin
        if (!interaction.interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) &&
            !interaction.interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators can accept rules for this server.');
            return;
        }

        const guildId = interaction.interaction.guildId;
        if (!guildId) {
            await interaction.ephemeralReply('❌ This can only be used in a server.');
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
