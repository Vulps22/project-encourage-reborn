import { moderationService, questionService, reportService } from "../../../services";
import { BotSelectMenuInteraction } from "../../../structures";
import { Handler, Logger } from "../../../utils";
import { QuestionType } from "../../../types";

const questionBanReasonSelected: Handler<BotSelectMenuInteraction> = {
    name: "questionBanReasonSelected",
    params: { id: 'id' },
    async execute(interaction) {
        const questionId = interaction.params.get(questionBanReasonSelected.params!.id);
        const selectedReason = interaction.values[0];

        if (!questionId) {
            Logger.error("Question ID not found when executing questionBanReasonSelected");
            await interaction.ephemeralReply('❌ Invalid question ID');
            return;
        }
        if (!selectedReason) {
            await interaction.ephemeralReply('❌ No reason selected');
            return;
        }

        try {
            await moderationService.banQuestion(questionId, interaction.user.id, selectedReason);
            const question = await questionService.getQuestionById(Number(questionId));
            if (!question) {
                await interaction.ephemeralReply('❌ Question not found');
                Logger.error(`Question with ID ${questionId} not found during banning for message ${interaction.message.id}`);
                return;
            }

            const logChannelId = question.type === QuestionType.Truth
                ? global.config.TRUTHS_LOG_CHANNEL_ID
                : global.config.DARES_LOG_CHANNEL_ID;
            await Logger.updateQuestionLog(question, logChannelId);

            const reports = await moderationService.findActioningReports(questionId);
            for (const report of reports) {
                await moderationService.actionedReport(report.id!, interaction.user.id);
                await reportService.notifyReporter(
                    report,
                    `Your report (#${report.id}) has been reviewed. Action has been taken against the reported content.`
                );
            }

            await interaction.ephemeralReply('✅ Question banned successfully!');

        } catch (error) {
            console.error('Error banning question:', error);
            await interaction.ephemeralReply('❌ Failed to ban question. Please try again.');
        }
    }
};

export default questionBanReasonSelected;
