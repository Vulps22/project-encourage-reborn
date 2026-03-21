import { questionService, votingService } from '../../../services';
import { BotCommandInteraction } from '../../../structures';
import { QuestionType } from '../../../types';
import { Command } from '../../../utils';
import { Logger } from '../../../utils';
import { questionEmbed } from '../../../views';

const random = new Command('random', 'Get a random truth or dare question')
  .setNSFW(true)
  .setAdministrator(false)
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    await interaction.deferReply();

    // 50/50 random selection
    const selectedType = Math.random() < 0.5 ? QuestionType.Truth : QuestionType.Dare;

    const question = await questionService.getRandomQuestion(selectedType);

    if (!question) {
      await interaction.editReply({
        content: `❌ No approved ${selectedType} questions available. Try again later!`,
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
        question.type
      );
    } catch (error) {
      Logger.error(`Failed to create vote tracking for message ${sentMessage.id}: ${error}`);
    }
  });

export default random;
