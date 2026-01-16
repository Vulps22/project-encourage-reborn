import { PermissionFlagsBits } from 'discord.js';
import { serverService } from '../../../services';
import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { rulesView } from '../../../views';

const acceptTermsButton: Handler<BotButtonInteraction> = {
    name: 'acceptTerms',
    params: {},
    async execute(interaction) {
        // Verify user is admin
        const member = interaction.member;
        if (!member || !('permissions' in member)) {
            await interaction.ephemeralReply('❌ Only administrators can accept terms for this server.');
            return;
        }

        const permissions = member.permissions as import('discord.js').PermissionsBitField;
        if (!permissions.has(PermissionFlagsBits.Administrator) &&
            !permissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators can accept terms for this server.');
            return;
        }

        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.ephemeralReply('❌ This can only be used in a server.');
            return;
        }

        // Mark terms as accepted
        await serverService.acceptTerms(guildId);

        // Proceed to rules step
        const message = rulesView();
        await interaction.sendReply(null, message);
    }
};

export default acceptTermsButton;
