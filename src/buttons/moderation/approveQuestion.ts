import { ButtonHandler } from "../../utils";
import { moderationService } from "../../services";

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
            await interaction.sendReply('✅ Question approved successfully!');
        } catch (error) {
            console.error('Error approving question:', error);
            await interaction.ephemeralReply('❌ Failed to approve question. Please try again.');
        }
    }
};

export default approveQuestionButton;