import { challengeService, questionService, votingService } from '../../../services';
import { BotCommandInteraction, errorView } from '@vulps22/bot-interactions';
import { QuestionType } from '@vulps22/project-encourage-types';
import { Command } from '../../../utils';
import { challengeEmbed } from '../../../views';

const dare = new Command('dare', 'Get a random dare question')
  .setNSFW(true)
  .setAdministrator(false)
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    await interaction.deferReply();

    const question = await questionService.getRandomQuestion(QuestionType.Dare);

    if (!question) {
      await interaction.sendReply(errorView('No approved dare questions available. Try again later!'));
      return;
    }

    const challenge = await challengeService.createChallenge(
      interaction.user.id,
      question.id,
      interaction.guildId!,
      interaction.channel?.id ?? null,
      interaction.user.username,
      QuestionType.Dare
    );

    const votes = await votingService.addChallenge(challenge.id);
    const message = challengeEmbed(question, challenge, votes);
    await interaction.sendReply(message);

    const sentMessage = await interaction.fetchReply();
    await challengeService.setMessageId(challenge.id, sentMessage.id);
  });

export default dare;
