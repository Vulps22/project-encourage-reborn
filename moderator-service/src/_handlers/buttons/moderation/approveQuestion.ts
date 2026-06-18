import { Handler, Logger } from "../../../bot/utils";
import { moderationService } from "../../../services";
import { MetaQuestionBuilder } from "../../../bot/builders/MetaQuestionBuilder";
import { LoggerService } from "../../../services/LoggerService";
import { BotButtonInteraction } from "@vulps22/bot-interactions";
import { QuestionType } from "@vulps22/project-encourage-types";
import { newQuestionView } from "../../../views/moderation/newQuestionView";

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

            const meta = await new MetaQuestionBuilder().getMetaQuestion(Number(questionId));
            if (!meta) {
                await interaction.ephemeralReply('❌ Question not found');
                Logger.error(`Question with ID ${questionId} not found during approval for message ${interaction.message.id}`);
                return;
            }

            const { question, user, server } = meta;

            if (!question.message_id) {
                await interaction.ephemeralReply('❌ Question has no associated log message');
                return;
            }

            const logChannelId = question.type === QuestionType.Truth
                ? process.env.TRUTHS_CHANNEL_ID!
                : process.env.DARES_CHANNEL_ID!;

            const updatedView = await newQuestionView(question, undefined, user, server);
            await LoggerService.update(logChannelId, question.message_id, updatedView);
            await interaction.sendReply('✅ Question approved successfully!');

        } catch (error) {
            console.error('Error approving question:', error);
            await interaction.ephemeralReply('❌ Failed to approve question. Please try again.');
        }
    }
};

export default approveQuestionButton;
