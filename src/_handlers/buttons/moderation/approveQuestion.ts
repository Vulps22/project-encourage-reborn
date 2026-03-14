import { Handler, Logger } from "../../../utils";
import { moderationService, questionService } from "../../../services";
import { BotButtonInteraction } from "../../../structures";
import { QuestionType } from "../../../types";

const approveQuestionButton: Handler<BotButtonInteraction> = {
    name: "approveQuestion",
    async execute(interaction) {
        const questionId = interaction.params.get("id");

        if (!questionId) {
            await interaction.ephemeralReply('❌ Invalid question ID');
            return;
        }

        try {
            await moderationService.approveQuestion(questionId, interaction.user.id);

            const question = await questionService.getQuestionById(Number(questionId)); // Ensure question exists
            if (!question) {
                await interaction.ephemeralReply('❌ Question not found');
                Logger.error(`Question with ID ${questionId} not found during approval for message ${interaction.message.id}`);
                return;
            }

            const logChannelId = question.type === QuestionType.Truth
                ? global.config.TRUTHS_LOG_CHANNEL_ID
                : global.config.DARES_LOG_CHANNEL_ID;
            await Logger.updateQuestionLog(question, logChannelId);
            await interaction.sendReply('✅ Question approved successfully!');

        } catch (error) {
            console.error('Error approving question:', error);
            await interaction.ephemeralReply('❌ Failed to approve question. Please try again.');
        }
    }
};

export default approveQuestionButton;