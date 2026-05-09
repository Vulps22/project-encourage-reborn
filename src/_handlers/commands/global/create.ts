import { MessageFlags } from 'discord.js';
import { questionService, serverService } from '../../../services';
import { msClient } from '../../../client';
import { BotCommandInteraction } from '@vulps22/bot-interactions';
import { QuestionType } from '@vulps22/project-encourage-types';
import { Command, Logger } from '../../../utils';
import { confirmNewQuestionEmbed } from '../../../views';

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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.guildId) {
      await interaction.editReply({
        content: '❌ This command can only be used in a server.',
      });
      return;
    }

    if (!await serverService.canCreate(interaction.guildId)) {
      await interaction.editReply({
        content: '❌ This server is not allowed to create questions. It has either been blocked or has not accepted the rules yet.',
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

    Logger.debug(`User ${interaction.user.id} submitted new question ID ${savedQuestion.id} for moderation`);
    await msClient.submitQuestion(savedQuestion.id);

    const response = confirmNewQuestionEmbed(savedQuestion);

    // For now, just acknowledge
    await interaction.sendReply(null, response);
  });

export default create;
