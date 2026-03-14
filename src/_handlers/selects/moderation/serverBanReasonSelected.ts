import { moderationService, reportService } from "../../../services";
import { BotSelectMenuInteraction } from "../../../structures";
import { Handler, Logger } from "../../../utils";
import { ServerProfileBuilder } from "../../../builders/ServerProfileBuilder";

const serverBanReasonSelected: Handler<BotSelectMenuInteraction> = {
    name: "serverBanReasonSelected",
    params: { id: 'id' },
    async execute(interaction) {
        const serverId = interaction.params.get(serverBanReasonSelected.params!.id);
        const selectedReason = interaction.values[0];

        if (!serverId) {
            Logger.error("Server ID not found when executing serverBanReasonSelected");
            await interaction.ephemeralReply('❌ Invalid server ID');
            return;
        }
        if (!selectedReason) {
            await interaction.ephemeralReply('❌ No reason selected');
            return;
        }

        try {
            await moderationService.banServer(serverId, interaction.user.id, selectedReason);

            const profile = await new ServerProfileBuilder().getServerProfile(serverId);
            if (!profile) {
                await interaction.ephemeralReply('❌ Server not found');
                Logger.error(`Server with ID ${serverId} not found during banning for message ${interaction.message.id}`);
                return;
            }

            await Logger.updateServerLog(profile);

            const report = await moderationService.findActioningReport(serverId);
            if (report?.id) {
                await moderationService.actionedReport(report.id, interaction.user.id);
                await reportService.notifyReporter(
                    report,
                    `Your report (#${report.id}) has been reviewed. Action has been taken against the reported content.`
                );
            }

            await interaction.ephemeralReply('✅ Server banned successfully!');

        } catch (error) {
            console.error('Error banning server:', error);
            await interaction.ephemeralReply('❌ Failed to ban server. Please try again.');
        }
    }
};

export default serverBanReasonSelected;
