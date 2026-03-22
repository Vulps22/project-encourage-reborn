import { MessageFlags } from 'discord.js';
import { BotCommandInteraction } from '../../../structures';
import { Command } from '../../../utils';
import { rulesView } from '../../../views/setup/rulesView';

const rules = new Command('rules', 'View the content rules for submitting truths and dares')
    .setNSFW(false)
    .setAdministrator(false)
    .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const message = rulesView(false);
        await interaction.sendReply(null, message);
    });

export default rules;
