import { UserProfileBuilder } from "../../../bot/builders/UserProfileBuilder";
import { BotSelectMenuInteraction, errorView } from "@vulps22/bot-interactions";
import { Handler, Logger } from "../../../bot/utils";
import { TargetType } from "@vulps22/project-encourage-types";
import { userProfileView } from "../../../views";
import { applyBan } from "../../shared/applyBan";
import { customBanReasonModal } from "../../shared/customBanReasonModal";
import { CUSTOM_REASON_VALUE } from "../../../bot/config";

const userBanReasonSelected: Handler<BotSelectMenuInteraction> = {
    name: "userBanReasonSelected",
    params: { 'ID': 'id' },
    interactionInitiator: false,
    async execute(interaction) {
        const userId = interaction.params.get(userBanReasonSelected.params!.ID);
        const selectedReason = interaction.values[0];

        if (!userId) {
            Logger.error("User ID not found when executing userBanReasonSelected");
            await interaction.ephemeralReply(errorView('Invalid user ID'));
            return;
        }

        if (!selectedReason) {
            await interaction.ephemeralReply(errorView('No reason selected'));
            return;
        }

        // Must come before any defer or reply — a modal cannot be shown once the
        // interaction has been responded to.
        if (selectedReason === CUSTOM_REASON_VALUE) {
            await interaction.showModal(customBanReasonModal(TargetType.User, userId));
            return;
        }

        await banUser(userId, selectedReason, interaction);
    }
};

async function banUser(userId: string, reason: string, interaction: BotSelectMenuInteraction): Promise<void> {
    try {
        await applyBan(TargetType.User, userId, reason, interaction.user.id);

        // Refresh the profile view on the message the select menu lives on. This
        // is the one part of the flow the modal path cannot do — a modal submit
        // has no component message to update.
        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if (!profile) {
            await interaction.ephemeralReply(errorView('User not found after banning'));
            Logger.error(`User ${userId} not found after banning`);
            return;
        }

        const view = await userProfileView(profile);
        await interaction.updateComponentMessage(view);

    } catch (error) {
        Logger.error(`Error banning user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        await interaction.ephemeralReply(errorView('Failed to ban user. Please try again.'));
    }
}

export default userBanReasonSelected;
