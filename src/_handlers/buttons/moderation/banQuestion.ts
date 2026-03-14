import { Handler, Logger } from "../../../utils";
import { moderationService, questionService } from "../../../services";
import { Snowflake } from "discord.js";
import { QuestionNotFoundError } from "../../../errors/QuestionNotFoundError";
import { NullChannelError } from "../../../errors/NullChannelError";
import { TargetType } from "../../../types";
import { BotButtonInteraction } from "../../../structures";

const approveQuestionButton: Handler<BotButtonInteraction> = {
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

            interaction.message.awaitMessageComponent({
                filter: i => i.customId.startsWith(`moderation_questionBanReasonSelected`),
                time: 60_000
            }).catch(async () => {
                const question = await questionService.getQuestionById(Number(questionId));
                if (question) await Logger.updateQuestionLog(question, interaction.channel!.id);
            });
        }

    }
};

async function showBanReasons(questionId: number, channelId: Snowflake): Promise<void> {

    const question = await questionService.getQuestionById(questionId);

    if(!question) {
        throw new QuestionNotFoundError(questionId);
    }

    const reasons = moderationService.getBanReasons(TargetType.Question);

    await Logger.updateQuestionLog(question, channelId, reasons);

}
export default approveQuestionButton;