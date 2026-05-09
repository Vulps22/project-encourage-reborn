import { BotModalInteraction } from '@vulps22/bot-interactions';
import { Handler } from '../../../utils';
import { dsClient, msClient } from '../../../client';
import { TargetType } from '@vulps22/project-encourage-types';

const reportModal: Handler<BotModalInteraction> = {
    name: 'reportModal',
    params: { id: 'id' },
    async execute(interaction: BotModalInteraction): Promise<void> {
        const questionId = interaction.params.get(reportModal.params!.id);
        if (!questionId) {
            await interaction.ephemeralReply('❌ Invalid question ID');
            throw new Error('Invalid question ID when using Modal: question_reportModal');
        }

        const question = await dsClient.getQuestion(parseInt(questionId));
        if (!question) {
            await interaction.ephemeralReply('❌ Question not found.');
            return;
        }

        const reason = interaction.fields.getTextInputValue('reason');

        await msClient.submitReport(
            interaction.user.id,
            questionId,
            TargetType.Question,
            interaction.guildId!,
            question.question,
            reason
        );

        await interaction.ephemeralReply('✅ Report submitted successfully.');
    }
};

export default reportModal;
