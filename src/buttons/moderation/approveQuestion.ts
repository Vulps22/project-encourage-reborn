import { ButtonHandler, Logger } from "../../utils";
import { moderationService, questionService } from "../../services";

const approveQuestionButton: ButtonHandler = {
    name: "approveQuestion",
    async execute(interaction) {
        const questionId = interaction.params.get("id");

        if (!questionId) {
            await interaction.ephemeralReply('❌ Invalid question ID');
            return;
        }

        try {
            await moderationService.approveQuestion(questionId, interaction.user.id);
            if(!interaction.channel) throw new Error("Interaction channel is null when approving question");

            const question = await questionService.getQuestionById(Number(questionId)); // Ensure question exists
            if (!question) {
                await interaction.ephemeralReply('❌ Question not found');
                Logger.error(`Question with ID ${questionId} not found during approval for message ${interaction.message.id}`);
                return;
            }

            await Logger.updateQuestionLog(question, interaction.channel.id);
            await interaction.sendReply('✅ Question approved successfully!');

        } catch (error) {
            console.error('Error approving question:', error);
            await interaction.ephemeralReply('❌ Failed to approve question. Please try again.');
        }
    }
};

export default approveQuestionButton;