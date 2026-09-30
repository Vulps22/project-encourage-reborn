import { BotModalInteraction, errorView, successView } from '@vulps22/bot-interactions';
import { TargetType } from '@vulps22/project-encourage-types';
import { Handler, Logger } from '../../../bot/utils';
import { applyBan } from '../../shared/applyBan';
import { CUSTOM_REASON_FIELD } from '../../shared/customBanReasonModal';

const VALID_TYPES: TargetType[] = [TargetType.Question, TargetType.Server, TargetType.User];

/**
 * Submit handler for the modal opened by picking "Other (Custom Reason)" on any
 * of the three ban reason select menus. Serves all three; the target type and id
 * come from the custom id.
 */
const customBanReason: Handler<BotModalInteraction> = {
    name: 'customBanReason',
    params: { type: 'type', id: 'id' },
    interactionInitiator: false,
    async execute(interaction: BotModalInteraction): Promise<void> {
        const type = interaction.params.get(customBanReason.params!.type) as TargetType | undefined;
        const targetId = interaction.params.get(customBanReason.params!.id);

        if (!type || !VALID_TYPES.includes(type)) {
            Logger.error(`Invalid ban target type "${type}" in customBanReason modal`);
            await interaction.ephemeralReply(errorView('Invalid ban target type'));
            return;
        }

        if (!targetId) {
            Logger.error('Target ID not found when executing customBanReason modal');
            await interaction.ephemeralReply(errorView('Invalid target ID'));
            return;
        }

        const reason = interaction.fields.getTextInputValue(CUSTOM_REASON_FIELD).trim();
        if (!reason) {
            await interaction.ephemeralReply(errorView('A reason is required'));
            return;
        }

        try {
            await applyBan(type, targetId, reason, interaction.user.id);
            await interaction.ephemeralReply(successView(`Banned with reason: ${reason}`));
        } catch (error) {
            Logger.error(`Error applying custom-reason ban to ${type} ${targetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            await interaction.ephemeralReply(errorView('Failed to apply the ban. Please try again.'));
        }
    }
};

export default customBanReason;
