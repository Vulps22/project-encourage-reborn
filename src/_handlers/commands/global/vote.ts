import { BotCommandInteraction } from '@vulps22/bot-interactions';
import { Command } from '../../../utils';
import { inventoryService } from '../../../services';
import { Storable } from '@vulps22/project-encourage-types';

const vote = new Command('vote', 'Check your skips and vote for the bot on Top.gg')
    .setNSFW(false)
    .setAdministrator(false)
    .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
        const topggUrl = process.env.TOPGG_URL;
        const inventory = await inventoryService.get(interaction.user.id, Storable.Skip);
        const skips = inventory?.qty ?? 0;

        await interaction.ephemeralReply(
            `🎟️ You have **${skips}** skip${skips !== 1 ? 's' : ''} remaining.\n\n` +
            `Vote for the bot on [Top.gg](<${topggUrl}>) to earn more!`
        );
    });

export default vote;
