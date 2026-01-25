import { moderationService } from '../../../services';
import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { ReportView } from '../../../views/moderation/reportView';

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
            const updatedReport = await moderationService.clearReport(reportId, interaction.user.id);

            // Update the message with new report view
            const view = await ReportView(updatedReport);
            console.log(view);
            await interaction.updateComponentMessage(null, view);

        } catch (error) {
            await interaction.ephemeralFollowUp(`❌ Failed to clear report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};

export default clearReportButton;