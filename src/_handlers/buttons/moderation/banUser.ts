import { UserProfileBuilder } from "../../../builders/UserProfileBuilder";
import { BotButtonInteraction } from "../../../structures";
import { Handler } from "../../../utils";
import { userService } from "../../../services";
import { userProfileView } from "../../../views";

const banUserButton: Handler<BotButtonInteraction> = {
    name: "banUser",
    params: { 'ID': 'id' },
    async execute(interaction) {
        const userId = interaction.params.get(banUserButton.params!.ID);
        if (!userId) {
            await interaction.ephemeralReply('❌ Invalid user ID');
            throw new Error('Invalid user ID when using Button: moderation_banUser');
        }

        // Ban the user
        await userService.banUser(userId, 'Banned by moderator');

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

export default banUserButton;