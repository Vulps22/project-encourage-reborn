import { moderationService } from '../../../services';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import { Handler, ModerationLogger } from '../../../bot/utils';

/**
 * Mark a report as actioning - indicates that action is being taken
 */
const actionReportButton: Handler<BotButtonInteraction> = {
    name: 'takeAction',
    params: { id: 'string' },
    async execute(interaction) {
        await interaction.deferUpdate();

        // Extract report ID from custom ID
        const reportId = parseInt(interaction.params.get('id') || '0');
        
        if (!reportId || reportId < 1) {
            await interaction.ephemeralReply('❌ Invalid report ID.');
            return;
        }

        try {
            // Mark the report as actioning in database
            const updatedReport = await moderationService.actioningReport(reportId, interaction.user.id);

            const banReasonList = moderationService.getBanReasons(updatedReport.type);
            await ModerationLogger.updateReportLog(updatedReport, banReasonList);

            interaction.message.awaitMessageComponent({
                filter: i => i.customId.includes('BanReasonSelected'),
                time: 60_000
            }).catch(async () => {
                const resetReport = await moderationService.resetReport(reportId);
                await ModerationLogger.updateReportLog(resetReport);
            });

        } catch (error) {
            await interaction.ephemeralFollowUp(`❌ Failed to mark report as actioning: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};

export default actionReportButton;