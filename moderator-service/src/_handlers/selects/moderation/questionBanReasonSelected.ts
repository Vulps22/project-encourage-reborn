import { BotSelectMenuInteraction, errorView } from "@vulps22/bot-interactions";
import { Handler, Logger } from "../../../bot/utils";
import { TargetType } from "@vulps22/project-encourage-types";
import { applyBan, BanTargetNotFoundError } from "../../shared/applyBan";
import { customBanReasonModal } from "../../shared/customBanReasonModal";
import { CUSTOM_REASON_VALUE } from "../../../bot/config";

const questionBanReasonSelected: Handler<BotSelectMenuInteraction> = {
    name: "questionBanReasonSelected",
    params: { id: 'id' },
    interactionInitiator: false,
    async execute(interaction) {
        const questionId = interaction.params.get(questionBanReasonSelected.params!.id);
        const selectedReason = interaction.values[0];

        if (!questionId) {
            Logger.error("Question ID not found when executing questionBanReasonSelected");
            await interaction.ephemeralReply(errorView('Invalid question ID'));
            return;
        }
        if (!selectedReason) {
            await interaction.ephemeralReply(errorView('No reason selected'));
            return;
        }

        // Must come before deferUpdate — a modal cannot be shown once the
        // interaction has been deferred.
        if (selectedReason === CUSTOM_REASON_VALUE) {
            await interaction.showModal(customBanReasonModal(TargetType.Question, questionId));
            return;
        }

        await interaction.deferUpdate();

        try {
            await applyBan(TargetType.Question, questionId, selectedReason, interaction.user.id);

        } catch (error) {
            if (error instanceof BanTargetNotFoundError) {
                Logger.error(`Question with ID ${questionId} not found during banning for message ${interaction.message.id}`);
                await interaction.ephemeralFollowUp(errorView('Question not found'));
                return;
            }
            Logger.error(`Error banning question: ${error}`);
            await interaction.ephemeralFollowUp(errorView('Failed to ban question. Please try again.'));
        }
    }
};

export default questionBanReasonSelected;
