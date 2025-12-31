import { questionService } from '../../../services';
import { BotCommandInteraction } from '../../../structures';
import { QuestionType } from '../../../types';
import { Command } from '../../../utils';
import { questionEmbed } from '../../../views';

const truth = new Command('truth', 'Get a random truth question')
  .setNSFW(true)
  .setAdministrator(false)
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    await interaction.deferReply();

    const question = await questionService.getRandomQuestion(QuestionType.Truth);

    if (!question) {
      await interaction.editReply({
        content: '❌ No approved truth questions available. Try again later!',
      });
      return;
    }

    const message = questionEmbed(question);
    await interaction.sendReply(null, message);
  });

export default truth;