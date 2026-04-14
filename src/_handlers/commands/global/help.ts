import { BotCommandInteraction } from '@vulps22/bot-interactions';
import { Command } from '../../../utils';
import helpView from '../../../views/util/helpView';

const help = new Command('help', 'Display all available commands and features')
  .setNSFW(false)
  .setAdministrator(false)
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    const message = helpView();
    await interaction.sendReply(null, message);
  });

export default help;
