import { UserProfileBuilder } from "../../../bot/builders/UserProfileBuilder";
import { BotButtonInteraction } from "@vulps22/bot-interactions";
import { Handler } from "../../../bot/utils";
import { userProfileView } from "../../../views";

const viewOffenderButton: Handler<BotButtonInteraction> = {
    name: "viewOffender",
    params: { id: 'id' },
    async execute(interaction) {
        const userId = interaction.params.get(viewOffenderButton.params!.id);
        if (!userId) {
            await interaction.ephemeralReply('❌ Invalid user ID');
            throw new Error('Invalid user ID when using Button: moderation_viewOffender');
        }

        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if (!profile) {
            await interaction.ephemeralReply('❌ User not found');
            return;
        }

        const view = await userProfileView(profile);
        await interaction.ephemeralReply(null, view);
    }
};

export default viewOffenderButton;
