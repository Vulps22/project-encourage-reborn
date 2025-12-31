import { UserProfileBuilder } from "../../../builders/UserProfileBuilder";
import { BotButtonInteraction } from "../../../structures";
import { Handler } from "../../../utils";
import { moderationService } from "../../../services";
import { userProfileView } from "../../../views";
import { TargetType } from "../../../types";

const banUserButton: Handler<BotButtonInteraction> = {
    name: "banUser",
    params: { 'ID': 'id' },
    async execute(interaction) {
        const userId = interaction.params.get(banUserButton.params!.ID);
        if (!userId) {
            await interaction.ephemeralReply('❌ Invalid user ID');
            throw new Error('Invalid user ID when using Button: moderation_banUser');
        }

        // Get user profile
        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if (!profile) {
            await interaction.ephemeralReply('❌ User not found');
            return;
        }

        // Get ban reasons and update message with dropdown
        const reasons = moderationService.getBanReasons(TargetType.User);
        const view = await userProfileView(profile, reasons);
        await interaction.sendReply(null, view);
    }
};

export default banUserButton;