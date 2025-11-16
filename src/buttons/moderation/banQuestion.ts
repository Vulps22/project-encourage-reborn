import { ButtonHandler, Logger } from "../../utils";
import { moderationService, questionService } from "../../services";
import { Snowflake } from "discord.js";
import { QuestionNotFoundError } from "../../errors/QuestionNotFoundError";
import { NullChannelError } from "../../errors/NullChannelError";
import { TargetType } from "../../types";

const approveQuestionButton: ButtonHandler = {
    name: "banQuestion",
    async execute(interaction) {
        const questionId = interaction.params.get("id");
        const reason = interaction.params.get("reason") || null;

        if(!interaction.channel) {
            await interaction.ephemeralReply('❌ Interaction channel is null');
            throw new NullChannelError();
        }

        if (!questionId) {
            await interaction.ephemeralReply('❌ Invalid question ID');
            return;
        }

        if(!reason) {
            await showBanReasons(Number(questionId), interaction.channel.id);
        }

    }
};

async function showBanReasons(questionId: number, channelId: Snowflake) {

    const question = await questionService.getQuestionById(questionId);

    if(!question) {
        throw new QuestionNotFoundError(questionId);
    }

    const reasons = await moderationService.getBanReasons(TargetType.Question);

    await Logger.updateQuestionLog(question, channelId, reasons);

}


// async function banQuestion(questionId: string, reason: string, interaction: BotButtonInteraction): Promise<void> {
//     try {
//             await moderationService.banQuestion(questionId, interaction.user.id, reason);
//             if(!interaction.channel) throw new Error("Interaction channel is null when banning question");

//             const question = await questionService.getQuestionById(Number(questionId)); // Ensure question exists
//             if (!question) {
//                 await interaction.ephemeralReply('❌ Question not found');
//                 Logger.error(`Question with ID ${questionId} not found during banning for message ${interaction.message.id}`);
//                 return;
//             }

//             await Logger.updateQuestionLog(question, interaction.channel.id);
//             await interaction.sendReply('✅ Question banned successfully!');

//         } catch (error) {
//             console.error('Error banning question:', error);
//             await interaction.ephemeralReply('❌ Failed to ban question. Please try again.');
//         }
//     }
// };

export default approveQuestionButton;