import { challengeService, questionService, votingService } from '../../../services';
import { BotCommandInteraction } from '../../../structures';
import { QuestionType } from '../../../types';
import { Command } from '../../../utils';
import { challengeEmbed } from '../../../views';

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

    const challenge = await challengeService.createChallenge(
      interaction.user.id,
      question.id,
      interaction.guildId!,
      interaction.channel?.id ?? null,
      interaction.user.username,
      QuestionType.Truth
    );

    const votes = await votingService.addChallenge(challenge.id);
    const message = challengeEmbed(question, challenge, votes);
    await interaction.sendReply(null, message);

    const sentMessage = await interaction.fetchReply();
    await challengeService.setMessageId(challenge.id, sentMessage.id);
  });

export default truth;
