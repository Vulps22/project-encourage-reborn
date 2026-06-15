
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import { Report, ReportStatus, TargetType } from "@vulps22/project-encourage-types";
import { UniversalMessage } from "@vulps22/bot-interactions";

function reportView(report: Report, banReasons: [] | null ): UniversalMessage {
    const title = new TextDisplayBuilder()
        .setContent(`## **New Report Submitted**`);

    const typeLabel = report.type === TargetType.Question && report.question_type
        ? `${report.type} (${report.question_type})`
        : report.type;

    const reportInfo = new TextDisplayBuilder()
        .setContent(
            `**Report ID:** ${report.id}   **Type:** ${typeLabel}   **Status:** ${report.status}\n\n` +
            `**Content:** ${report.content || 'No content provided'}\n\n` +
            `**Reason:** ${report.reason || 'No reason provided'}\n\n` +
            `**Reporter:** <@${report.sender_id}> ( ${report.sender_id} )\n\n` +
            `**Offender ID:** ${report.offender_id}\n\n` +
            `**Server ID:** ${report.server_id}`
        );

    const clearButton = new ButtonBuilder()
        .setCustomId(`moderation_clearReport_id:${report.id}`)
        .setLabel('Clear Report')
        .setStyle(ButtonStyle.Success)
        .setDisabled(report.status === ReportStatus.CLEARED || report.status === ReportStatus.ACTIONED);

    const actionButton = new ButtonBuilder()
        .setCustomId(`moderation_takeAction_id:${report.id}`)
        .setLabel('Take Action')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(report.status === ReportStatus.ACTIONED);

    const viewOffenderButton = new ButtonBuilder()
        .setCustomId(`moderation_viewOffender_id:${report.offender_user_id ?? report.offender_id}`)
        .setLabel('View Offender')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(report.offender_user_id == null);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(clearButton, actionButton, viewOffenderButton);

        const selectHandlerName = report.type === TargetType.Server
            ? 'serverBanReasonSelected'
            : report.type === TargetType.User
                ? 'userBanReasonSelected'
                : 'questionBanReasonSelected';

        const reasonList = new StringSelectMenuBuilder()
        .addOptions(banReasons || [])
        .setCustomId(`moderation_${selectHandlerName}_id:${report.offender_id}`)
        .setPlaceholder('Select a reason for banning')
        .setMinValues(1)
        .setMaxValues(1);

    const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(reasonList);

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(reportInfo)

    if (report.status == ReportStatus.ACTIONING) {
        container.addActionRowComponents(selectMenuRow);
    } else {
        container.addActionRowComponents(buttonRow);
    }

    const message: UniversalMessage = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    return message;
}

export { reportView as ReportView };
