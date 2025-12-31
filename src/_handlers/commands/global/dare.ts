import { questionService } from '../../../services';
import { BotCommandInteraction } from '../../../structures';
import { QuestionType } from '../../../types';
import { Command } from '../../../utils';
import { questionEmbed } from '../../../views';

const dare = new Command('dare', 'Get a random dare question')
  .setNSFW(true)
  .setAdministrator(false)
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    await interaction.deferReply();

    const question = await questionService.getRandomQuestion(QuestionType.Dare);

    if (!question) {
      await interaction.editReply({
        content: '❌ No approved dare questions available. Try again later!',
      });
      return;
    }

    const message = questionEmbed(question);
    await interaction.sendReply(null, message);
  });

export default dare;