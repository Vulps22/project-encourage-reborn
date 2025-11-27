import { MessageFlags } from 'discord.js';
import { questionService } from '../../../services';
import { BotCommandInteraction } from '../../../structures';
import { QuestionType } from '../../../types';
import { Command } from '../../../utils';

const truth = new Command('truth', 'Get a random truth question')
  .setNSFW(true)
  .setAdministrator(false)
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const question = await questionService.getRandomQuestion(QuestionType.Truth);

    if (!question) {
      await interaction.editReply({
        content: '❌ No approved truth questions available. Try again later!',
      });
      return;
    }

    await interaction.editReply({
      content: `**Truth:** ${question.question}`,
    });
  });

export default truth;
