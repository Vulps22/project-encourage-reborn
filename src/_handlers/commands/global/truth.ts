import { questionService, votingService } from '../../../services';
import { BotCommandInteraction } from '../../../structures';
import { QuestionType } from '../../../types';
import { Command } from '../../../utils';
import { Logger } from '../../../utils';
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

    const sentMessage = await interaction.fetchReply();
    try {
      await votingService.createVoteTracking(
        sentMessage.id,
        interaction.user.id,
        question.id,
        interaction.guildId!,
        interaction.channel?.id ?? null,
        interaction.user.username,
        QuestionType.Truth
      );
    } catch (error) {
      Logger.error(`Failed to create vote tracking for message ${sentMessage.id}: ${error}`);
    }
  });

export default truth;