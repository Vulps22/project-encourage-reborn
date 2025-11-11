import { questionService } from '../../services';
import { BotCommandInteraction } from '../../structures';
import { QuestionType } from '../../types/QuestionType';
import { Command } from '../../utils';
import { confirmNewQuestionEmbed } from '../../views';

const create = new Command('create', 'Submit a custom truth or dare question')
  .addStringOption('type', 'Question type', true)
    .addChoice('Truth', 'truth')
    .addChoice('Dare', 'dare')
    .done()
  .addStringOption('question', 'Your question', true)
    .setMaxLength(500)
    .done()
  .setNSFW(true)
  .setAdministrator(false)
  .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guildId) {
      await interaction.editReply({
        content: '❌ This command can only be used in a server.',
      });
      return;
    }

    const type = interaction.options.getString('type', true);
    const question = interaction.options.getString('question', true);

    const savedQuestion = await questionService.createQuestion(type as QuestionType, question, interaction.user.id, interaction.guildId);

    if (typeof savedQuestion === 'string') {
      await interaction.editReply({
        content: `❌ ${savedQuestion}`,
      });
      return;
    }

    const response = confirmNewQuestionEmbed(savedQuestion);

    // For now, just acknowledge
    await interaction.sendReply(null, response);
  });

export default create;
