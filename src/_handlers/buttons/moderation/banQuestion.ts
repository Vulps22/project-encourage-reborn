import { Handler, ModerationLogger } from "../../../utils";
import { moderationService, questionService } from "../../../services";
import { QuestionNotFoundError } from "../../../errors/QuestionNotFoundError";
import { QuestionType, TargetType } from "../../../types";
import { BotButtonInteraction } from "@vulps22/bot-interactions";

const approveQuestionButton: Handler<BotButtonInteraction> = {
    name: "banQuestion",
    async execute(interaction) {
        const questionId = interaction.params.get("id");
        const reason = interaction.params.get("reason") || null;

        if (!questionId) {
            await interaction.ephemeralReply('❌ Invalid question ID');
            return;
        }

        if(!reason) {
            await showBanReasons(Number(questionId));

            interaction.message.awaitMessageComponent({
                filter: i => i.customId.startsWith(`moderation_questionBanReasonSelected`),
                time: 60_000
            }).catch(async () => {
                const question = await questionService.getQuestionById(Number(questionId));
                if (question) {
                    const logChannelId = question.type === QuestionType.Truth
                        ? global.config.TRUTHS_LOG_CHANNEL_ID
                        : global.config.DARES_LOG_CHANNEL_ID;
                    await ModerationLogger.updateQuestionLog(question, logChannelId);
                }
            });
        }

    }
};

async function showBanReasons(questionId: number): Promise<void> {
    const question = await questionService.getQuestionById(questionId);

    if(!question) {
        throw new QuestionNotFoundError(questionId);
    }

    const logChannelId = question.type === QuestionType.Truth
        ? global.config.TRUTHS_LOG_CHANNEL_ID
        : global.config.DARES_LOG_CHANNEL_ID;
    const reasons = moderationService.getBanReasons(TargetType.Question);

    await ModerationLogger.updateQuestionLog(question, logChannelId, reasons);
}
export default approveQuestionButton;