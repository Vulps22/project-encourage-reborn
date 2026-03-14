import { moderationService } from '../../../services';
import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { ReportView } from '../../../views/moderation/reportView';

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
            const view = await ReportView(updatedReport, banReasonList as []);
            await interaction.updateComponentMessage(null, view);

            interaction.message.awaitMessageComponent({
                filter: i => i.customId.includes('BanReasonSelected'),
                time: 60_000
            }).catch(async () => {
                const resetReport = await moderationService.resetReport(reportId);
                const revertedView = await ReportView(resetReport, null);
                await interaction.message.edit(revertedView as any);
            });

        } catch (error) {
            await interaction.ephemeralFollowUp(`❌ Failed to mark report as actioning: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};

export default actionReportButton;