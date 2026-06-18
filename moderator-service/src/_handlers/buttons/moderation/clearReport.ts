import { moderationService, reportService } from '../../../services';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import { Handler } from '../../../bot/utils';

/**
 * Clear a report - marks it as resolved without taking action
 */
const clearReportButton: Handler<BotButtonInteraction> = {
    name: 'clearReport',
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
            // Clear the report in database
            await moderationService.clearReport(reportId, interaction.user.id);

            // Fetch the cleared report to get details for notification
            const clearedReport = await moderationService.getReport(reportId);
            if (!clearedReport) {
                throw new Error('Report not found after clearing');
            }

            await reportService.notifyReporter(
                clearedReport,
                `Your report (#${clearedReport.id}) has been reviewed. No action was taken.`
            );

        } catch (error) {
            await interaction.ephemeralFollowUp(`❌ Failed to clear report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};

export default clearReportButton;