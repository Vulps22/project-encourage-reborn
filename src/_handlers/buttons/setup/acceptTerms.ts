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
        if (!interaction.interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) &&
            !interaction.interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators can accept terms for this server.');
            return;
        }

        const guildId = interaction.interaction.guildId;
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
