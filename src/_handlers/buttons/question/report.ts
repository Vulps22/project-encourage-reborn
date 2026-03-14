import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { db, reportService } from '../../../services';
import { Question } from '../../../interface';
import { TargetType } from '../../../types';

const reportButton: Handler<BotButtonInteraction> = {
    name: 'report',
    params: { id: 'id' },
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get(reportButton.params!.id);
        if (!questionId) {
            await interaction.ephemeralReply('❌ Invalid question ID');
            throw new Error('Invalid question ID when using Button: question_report');
        }

        const question = await db.get<Question>('question', 'questions', { id: parseInt(questionId) });
        if (!question) {
            await interaction.ephemeralReply('❌ Question not found.');
            return;
        }

        await reportService.createReport(
            interaction.user.id,
            questionId,
            TargetType.Question,
            interaction.guildId!
        );

        await interaction.ephemeralReply('✅ Report submitted successfully.');
    }
};

export default reportButton;
