import { BotModalInteraction } from '@vulps22/bot-interactions';
import { Handler } from '../../../bot/utils';
import { db, reportService } from '../../../services';
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

        const question = await db.getQuestion(parseInt(questionId));
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
