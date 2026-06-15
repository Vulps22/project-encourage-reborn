import { UserProfileBuilder } from "../../../bot/builders/UserProfileBuilder";
import { BotButtonInteraction } from "@vulps22/bot-interactions";
import { Handler, Logger } from "../../../bot/utils";
import { questionService, serverService, userService } from "../../../services";
import { userProfileView } from "../../../views";

const unbanUserButton: Handler<BotButtonInteraction> = {
    name: "unbanUser",
    params: { 'ID': 'id' },
    async execute(interaction) {
        const userId = interaction.params.get(unbanUserButton.params!.ID);
        if (!userId) {
            await interaction.ephemeralReply('❌ Invalid user ID');
            throw new Error('Invalid user ID when using Button: moderation_unbanUser');
        }

        // Unban the user
        await userService.unbanUser(userId);

        // Unban all questions that were banned due to user ban
        const unbannedQuestionsCount = await questionService.unbanUserBannedQuestions(userId);
        Logger.debug(`Unbanned ${unbannedQuestionsCount} questions from user ${userId}`);

        // Unban all servers owned by the user
        const unbannedServersCount = await serverService.unbanUserServers(userId);
        Logger.debug(`Unbanned ${unbannedServersCount} servers owned by user ${userId}`);

        // Refresh the profile view
        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if (!profile) {
            await interaction.ephemeralReply('❌ User not found');
            return;
        }

        const view = await userProfileView(profile);
        await interaction.sendReply(null, view);
    }
};

export default unbanUserButton;
