import { PermissionFlagsBits } from 'discord.js';
import { serverService } from '../../../services';
import { BotButtonInteraction, errorView } from '@vulps22/bot-interactions';
import { Handler } from '../../../utils';
import { rulesView } from '../../../views';

const acceptTermsButton: Handler<BotButtonInteraction> = {
    name: 'acceptTerms',
    params: {},
    interactionInitiator: false,
    async execute(interaction) {
        // Verify user is admin
        const member = interaction.member;
        if (!member || !('permissions' in member)) {
            await interaction.ephemeralReply(errorView('Only administrators can accept terms for this server.'));
            return;
        }

        const permissions = member.permissions as import('discord.js').PermissionsBitField;
        if (!permissions.has(PermissionFlagsBits.Administrator) &&
            !permissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply(errorView('Only administrators can accept terms for this server.'));
            return;
        }

        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.ephemeralReply(errorView('This can only be used in a server.'));
            return;
        }

        // Mark terms as accepted
        await serverService.acceptTerms(guildId);

        // Proceed to rules step
        const message = rulesView();
        await interaction.sendReply(message);
    }
};

export default acceptTermsButton;
