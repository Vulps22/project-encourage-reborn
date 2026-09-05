import { BotSelectMenuInteraction, errorView, successView } from "@vulps22/bot-interactions";
import { Handler, Logger } from "../../../bot/utils";
import { TargetType } from "@vulps22/project-encourage-types";
import { applyBan, BanTargetNotFoundError } from "../../shared/applyBan";
import { customBanReasonModal } from "../../shared/customBanReasonModal";
import { CUSTOM_REASON_VALUE } from "../../../bot/config";

const serverBanReasonSelected: Handler<BotSelectMenuInteraction> = {
    name: "serverBanReasonSelected",
    params: { id: 'id' },
    interactionInitiator: false,
    async execute(interaction) {
        const serverId = interaction.params.get(serverBanReasonSelected.params!.id);
        const selectedReason = interaction.values[0];

        if (!serverId) {
            Logger.error("Server ID not found when executing serverBanReasonSelected");
            await interaction.ephemeralReply(errorView('Invalid server ID'));
            return;
        }
        if (!selectedReason) {
            await interaction.ephemeralReply(errorView('No reason selected'));
            return;
        }

        // Must come before any defer or reply — a modal cannot be shown once the
        // interaction has been responded to.
        if (selectedReason === CUSTOM_REASON_VALUE) {
            await interaction.showModal(customBanReasonModal(TargetType.Server, serverId));
            return;
        }

        try {
            await applyBan(TargetType.Server, serverId, selectedReason, interaction.user.id);

            await interaction.ephemeralReply(successView('Server banned successfully!'));

        } catch (error) {
            if (error instanceof BanTargetNotFoundError) {
                Logger.error(`Server with ID ${serverId} not found during banning for message ${interaction.message.id}`);
                await interaction.ephemeralReply(errorView('Server not found'));
                return;
            }
            console.error('Error banning server:', error);
            await interaction.ephemeralReply(errorView('Failed to ban server. Please try again.'));
        }
    }
};

export default serverBanReasonSelected;
