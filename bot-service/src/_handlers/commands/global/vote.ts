import { BotCommandInteraction, noticeView } from '@vulps22/bot-interactions';
import { Command } from '../../../utils';
import { inventoryService } from '../../../services';

const vote = new Command('vote', 'Check your skips and vote for the bot on Top.gg', true)
    .setNSFW(false)
    .setAdministrator(false)
    .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
        const topggUrl = process.env.TOPGG_URL;
        const inventory = await inventoryService.get(interaction.user.id, 'skip');
        const skips = inventory?.qty ?? 0;

        await interaction.ephemeralReply(
            noticeView(
                `You have **${skips}** skip${skips !== 1 ? 's' : ''} remaining.\n\n` +
                `Vote for the bot on [Top.gg](<${topggUrl}>) to earn more!`
            )
        );
    });

export default vote;
