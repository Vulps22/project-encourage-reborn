
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { Report } from "../../interface";
import { UniversalMessage } from "../../types";

async function ReportView(report: Report): Promise<UniversalMessage> {
    const title = new TextDisplayBuilder()
        .setContent(`## **New Report Submitted**`);

    const reportInfo = new TextDisplayBuilder()
        .setContent(
            `**Report ID:** ${report.id}   **Type:** ${report.type}   **Status:** ${report.status}\n\n` +
            `**Reason:** ${report.reason || 'No reason provided'}\n\n` +
            `**Reporter:** <@${report.sender_id}> ( ${report.sender_id} )\n\n` +
            `**Offender ID:** ${report.offender_id}\n\n` +
            `**Server ID:** ${report.server_id}`
        );

    const clearButton = new ButtonBuilder()
        .setCustomId(`moderation_clearReport_id:${report.id}`)
        .setLabel('Clear Report')
        .setStyle(ButtonStyle.Success)
        .setDisabled(report.status === 'cleared');

    const actionButton = new ButtonBuilder()
        .setCustomId(`moderation_takeAction_id:${report.id}`)
        .setLabel('Take Action')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(report.status === 'actioned');

    const viewOffenderButton = new ButtonBuilder()
        .setCustomId(`moderation_viewOffender_id:${report.offender_id}`)
        .setLabel('View Offender')
        .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(clearButton, actionButton, viewOffenderButton);

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(reportInfo)
        .addActionRowComponents(buttonRow);

    const message: UniversalMessage = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    return message;
}

export { ReportView };
