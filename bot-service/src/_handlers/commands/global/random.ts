import { challengeService, questionService, votingService } from '../../../services';
import { BotCommandInteraction } from '@vulps22/bot-interactions';
import { QuestionType } from '@vulps22/project-encourage-types';
import { Command } from '../../../utils';
import { challengeEmbed } from '../../../views';

const random = new Command('random', 'Get a random truth or dare question')
  .setNSFW(true)
  .setAdministrator(false)
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    await interaction.deferReply();

    const selectedType = Math.random() < 0.5 ? QuestionType.Truth : QuestionType.Dare;
    const question = await questionService.getRandomQuestion(selectedType);

    if (!question) {
      await interaction.editReply({
        content: `❌ No approved ${selectedType} questions available. Try again later!`,
      });
      return;
    }

    const challenge = await challengeService.createChallenge(
      interaction.user.id,
      question.id,
      interaction.guildId!,
      interaction.channel?.id ?? null,
      interaction.user.username,
      question.type
    );

    const votes = await votingService.addChallenge(challenge.id);
    const message = challengeEmbed(question, challenge, votes);
    await interaction.sendReply(null, message);

    const sentMessage = await interaction.fetchReply();
    await challengeService.setMessageId(challenge.id, sentMessage.id);
  });

export default random;
