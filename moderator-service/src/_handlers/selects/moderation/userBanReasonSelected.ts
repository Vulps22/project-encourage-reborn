import { UserProfileBuilder } from "../../../bot/builders/UserProfileBuilder";
import { BotSelectMenuInteraction } from "@vulps22/bot-interactions";
import { Handler, Logger } from "../../../bot/utils";
import { moderationService, questionService, reportService, serverService, userService } from "../../../services";
import { userProfileView } from "../../../views";

const userBanReasonSelected: Handler<BotSelectMenuInteraction> = {
    name: "userBanReasonSelected",
    params: { 'ID': 'id' },
    async execute(interaction) {
        const userId = interaction.params.get(userBanReasonSelected.params!.ID);
        const selectedReason = interaction.values[0];

        if (!userId) {
            Logger.error("User ID not found when executing userBanReasonSelected");
            await interaction.ephemeralReply('❌ Invalid user ID');
            return;
        }

        if (!selectedReason) {
            await interaction.ephemeralReply('❌ No reason selected');
            return;
        }

        await banUser(userId, selectedReason, interaction);
    }
};

async function banUser(userId: string, reason: string, interaction: BotSelectMenuInteraction): Promise<void> {
    try {
        // Ban the user
        await userService.banUser(userId, reason);
        Logger.debug(`User ${userId} banned with reason: ${reason}`);

        // Ban all user's questions with "User Banned" reason
        const bannedQuestionsCount = await questionService.banAllUserQuestions(userId, interaction.user.id);
        Logger.debug(`Banned ${bannedQuestionsCount} questions from user ${userId}`);

        // Ban all servers owned by the user
        const bannedServersCount = await serverService.banUserServers(userId, reason);
        Logger.debug(`Banned ${bannedServersCount} servers owned by user ${userId}`);

        // Refresh the profile view
        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if (!profile) {
            await interaction.ephemeralReply('❌ User not found after banning');
            Logger.error(`User ${userId} not found after banning`);
            return;
        }

        const view = await userProfileView(profile);
        await interaction.updateComponentMessage(null, view);

        const reports = await moderationService.findActioningReports(userId);
        for (const report of reports) {
            await moderationService.actionedReport(report.id!, interaction.user.id);
            await reportService.notifyReporter(
                report,
                `Your report (#${report.id}) has been reviewed. Action has been taken against the reported content.`
            );
        }

    } catch (error) {
        Logger.error(`Error banning user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        await interaction.ephemeralReply('❌ Failed to ban user. Please try again.');
    }
}

export default userBanReasonSelected;
