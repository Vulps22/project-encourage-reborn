import { MessageFlags } from 'discord.js';
import { questionService, serverService } from '../../../services';
import { msClient } from '../../../client';
import { BotCommandInteraction, errorView } from '@vulps22/bot-interactions';
import { QuestionType } from '@vulps22/project-encourage-types';
import { Command } from '../../../utils';
import { Logger } from '@vulps22/logger';
import { confirmNewQuestionEmbed } from '../../../views';

const create = new Command('create', 'Submit a custom truth or dare question', true)
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
    console.log(`[DEBUG /create] Command received — user=${interaction.user.id} guild=${interaction.guildId}`);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.guildId) {
      console.log(`[DEBUG /create] Rejected: no guildId`);
      await interaction.sendReply(errorView('This command can only be used in a server.'));
      return;
    }

    console.log(`[DEBUG /create] Checking canCreate for guild=${interaction.guildId}`);
    const canCreate = await serverService.canCreate(interaction.guildId);
    console.log(`[DEBUG /create] canCreate=${canCreate}`);
    if (!canCreate) {
      await interaction.sendReply(errorView('This server is not allowed to create questions. It has either been blocked or has not accepted the rules yet.'));
      return;
    }

    const type = interaction.options.getString('type', true);
    const question = interaction.options.getString('question', true);
    console.log(`[DEBUG /create] Options — type=${type} question="${question.substring(0, 50)}${question.length > 50 ? '...' : ''}"`);

    console.log(`[DEBUG /create] Calling questionService.createQuestion`);
    const savedQuestion = await questionService.createQuestion(type as QuestionType, question, interaction.user.id, interaction.guildId);
    console.log(`[DEBUG /create] questionService.createQuestion returned: ${typeof savedQuestion === 'string' ? `error="${savedQuestion}"` : `id=${savedQuestion.id}`}`);

    if (typeof savedQuestion === 'string') {
      await interaction.sendReply(errorView(savedQuestion));
      return;
    }

    Logger.debug(`User ${interaction.user.id} submitted new question ID ${savedQuestion.id} for moderation`);
    console.log(`[DEBUG /create] Calling msClient.submitQuestion(${savedQuestion.id})`);
    await msClient.submitQuestion(savedQuestion.id);
    console.log(`[DEBUG /create] msClient.submitQuestion completed — question ${savedQuestion.id} handed to MS`);

    const response = confirmNewQuestionEmbed(savedQuestion);

    // For now, just acknowledge
    await interaction.sendReply(response);
    console.log(`[DEBUG /create] Ephemeral confirmation sent to user ${interaction.user.id}`);
  });

export default create;
