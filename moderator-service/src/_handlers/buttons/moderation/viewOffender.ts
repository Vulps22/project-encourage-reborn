import { UserProfileBuilder } from "../../../bot/builders/UserProfileBuilder";
import { BotButtonInteraction, errorView } from "@vulps22/bot-interactions";
import { Handler } from "../../../bot/utils";
import { userProfileView } from "../../../views";

const viewOffenderButton: Handler<BotButtonInteraction> = {
    name: "viewOffender",
    params: { id: 'id' },
    interactionInitiator: true,
    async execute(interaction) {
        const userId = interaction.params.get(viewOffenderButton.params!.id);
        if (!userId) {
            await interaction.ephemeralReply(errorView('Invalid user ID'));
            throw new Error('Invalid user ID when using Button: moderation_viewOffender');
        }

        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if (!profile) {
            await interaction.ephemeralReply(errorView('User not found'));
            return;
        }

        const view = await userProfileView(profile);
        await interaction.ephemeralReply(view);
    }
};

export default viewOffenderButton;
