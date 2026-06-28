import { UserProfileBuilder } from "../../../bot/builders/UserProfileBuilder";
import { BotButtonInteraction, errorView } from "@vulps22/bot-interactions";
import { Handler } from "../../../bot/utils";
import { userProfileView } from "../../../views";

const showUserButton: Handler<BotButtonInteraction> = {
    name: "showUser",
    params: { 'ID': 'id' },
    async execute(interaction) {
        const userId = interaction.params.get(showUserButton.params!.ID);
        if(!userId) {
            await interaction.ephemeralReply(errorView('Invalid user ID'));
            throw new Error('Invalid user ID when using Button: moderator_showUser');
        }
        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if(!profile) {
            await interaction.ephemeralReply(errorView('User not found'));
            return;
        }

        const view = await userProfileView(profile);
        await interaction.ephemeralReply(view);

    }
};

export default showUserButton;