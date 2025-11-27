import { moderationService, questionService } from "../../../services";
import { BotSelectMenuInteraction } from "../../../structures";
import { Handler, Logger } from "../../../utils";

const banReasonSelected: Handler<BotSelectMenuInteraction> = {
    name: "banReasonSelected",
    async execute(interaction) {
        const questionId = interaction.params.get("id");
        const selectedReason = interaction.values[0]; // Assuming single selection
        
        if(!questionId) {
            Logger.error("Question ID not found when executing banReasonSelected");
            await interaction.ephemeralReply('❌ Invalid question ID');
            return;
        }
        if(!selectedReason) {
            await interaction.ephemeralReply('❌ No reason selected');
            return;
        }
        await banQuestion(questionId, selectedReason, interaction);
    }
};

async function banQuestion(questionId: string, reason: string, interaction: BotSelectMenuInteraction): Promise<void> {
    try {
            await moderationService.banQuestion(questionId, interaction.user.id, reason);
            if(!interaction.channel) throw new Error("Interaction channel is null when banning question");

            const question = await questionService.getQuestionById(Number(questionId)); // Ensure question exists
            if (!question) {
                await interaction.ephemeralReply('❌ Question not found');
                Logger.error(`Question with ID ${questionId} not found during banning for message ${interaction.message.id}`);
                return;
            }

            await Logger.updateQuestionLog(question, interaction.channel.id);
            await interaction.sendReply('✅ Question banned successfully!');

        } catch (error) {
            console.error('Error banning question:', error);
            await interaction.ephemeralReply('❌ Failed to ban question. Please try again.');
        }
    }


export default banReasonSelected;