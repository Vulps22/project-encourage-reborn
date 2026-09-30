
import { BotButtonInteraction, errorView } from "@vulps22/bot-interactions";
import { Handler } from "../../../bot/utils";
import { moderationService } from "../../../services";
import { userProfileView } from "../../../views";
import { TargetType } from "@vulps22/project-encourage-types";
import { UserProfileBuilder } from "../../../bot/builders/UserProfileBuilder";
import { MessageEditOptions } from "discord.js";

const banUserButton: Handler<BotButtonInteraction> = {
    name: "banUser",
    params: { 'ID': 'id' },
    interactionInitiator: false,
    async execute(interaction) {
        const userId = interaction.params.get(banUserButton.params!.ID);
        if (!userId) {
            await interaction.ephemeralReply(errorView('Invalid user ID'));
            throw new Error('Invalid user ID when using Button: moderation_banUser');
        }

        // Get user profile
        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if (!profile) {
            await interaction.ephemeralReply(errorView('User not found'));
            return;
        }

        // Get ban reasons and update message with dropdown
        const reasons = moderationService.getBanReasons(TargetType.User);
        const view = await userProfileView(profile, reasons);
        await interaction.updateComponentMessage(view);

        interaction.message.awaitMessageComponent({
            filter: i => i.customId.startsWith(`moderation_userBanReasonSelected`),
            time: 60_000
        }).catch(async () => {
            const revertedView = await userProfileView(profile);
            await interaction.message.edit(revertedView as unknown as MessageEditOptions);
        });
    }
};

export default banUserButton;