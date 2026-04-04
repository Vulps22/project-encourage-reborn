import { BotModalInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { db, reportService } from '../../../services';
import { Question } from '../../../interface';
import { TargetType } from '../../../types';

const reportModal: Handler<BotModalInteraction> = {
    name: 'reportModal',
    params: { id: 'id' },
    async execute(interaction: BotModalInteraction): Promise<void> {
        const questionId = interaction.params.get(reportModal.params!.id);
        if (!questionId) {
            await interaction.ephemeralReply('❌ Invalid question ID');
            throw new Error('Invalid question ID when using Modal: question_reportModal');
        }

        const question = await db.get<Question>('question', 'questions', { id: parseInt(questionId) });
        if (!question) {
            await interaction.ephemeralReply('❌ Question not found.');
            return;
        }

        const reason = interaction.fields.getTextInputValue('reason');

        await reportService.createReport(
            interaction.user.id,
            questionId,
            question.question,
            TargetType.Question,
            interaction.guildId!,
            reason
        );

        await interaction.ephemeralReply('✅ Report submitted successfully.');
    }
};

export default reportModal;
