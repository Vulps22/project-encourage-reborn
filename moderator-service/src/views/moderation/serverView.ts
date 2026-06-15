import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import { ServerProfile } from "@vulps22/project-encourage-types";
import { UniversalMessage } from "@vulps22/bot-interactions";

async function serverView(server: ServerProfile, banReasons: [] | null = null): Promise<UniversalMessage> {

    const title = new TextDisplayBuilder()
        .setContent(`🖥️ **Server: ${server.name}** (Server ID: ${server.id})`);

    //get the user's username. do not use cache
    const user = await global.client.users.fetch(server.user_id);
    const username = user ? user.username : "Unknown User";

    const serverInfo = new TextDisplayBuilder()
        .setContent(`**Owner:**\n${username} (User ID: ${server.user_id})`);

    const statusEmoji = server.is_banned ? "🚫" : "✅";
    const statusText = server.is_banned ? "BANNED" : "Active";
    const createEmoji = server.can_create ? "✅" : "❌";
    const statusInfo = new TextDisplayBuilder()
        .setContent(`**Status:** ${statusEmoji} ${statusText}   **Create:** ${createEmoji}`);

    let banReasonInfo: TextDisplayBuilder | null = null;
    if (server.is_banned && server.ban_reason) {
        banReasonInfo = new TextDisplayBuilder()
            .setContent(`**Ban Reason:** ${server.ban_reason}`);
    }

    const statsInfo = new TextDisplayBuilder()
        .setContent(
            `**Registered Users:** ${server.userCount} (Banned: ${server.bannedUserCount})\n\n` +
            `**Submitted Questions:** ${server.questionCount} ` +
            `(Approved: ${server.approvedQuestionCount} | Banned: ${server.bannedQuestionCount})`
        );

    const banButton = new ButtonBuilder()
        .setCustomId(`moderation_banServer_id:${server.id}`)
        .setLabel('Ban Server')
        .setStyle(ButtonStyle.Danger);

    const unbanButton = new ButtonBuilder()
        .setCustomId(`moderation_unbanServer_id:${server.id}`)
        .setLabel('Unban Server')
        .setStyle(ButtonStyle.Success);

    const viewOffenderButton = new ButtonBuilder()
        .setCustomId(`moderation_viewOffender_id:${server.user_id}`)
        .setLabel('View Offender')
        .setStyle(ButtonStyle.Secondary);

    const reasonList = new StringSelectMenuBuilder()
        .addOptions(banReasons || [])
        .setCustomId(`moderation_serverBanReasonSelected_id:${server.id}`)
        .setPlaceholder('Select a reason for banning')
        .setMinValues(1)
        .setMaxValues(1);

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(serverInfo, statusInfo);

    if (banReasonInfo) {
        container.addTextDisplayComponents(banReasonInfo);
    }

    container
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(statsInfo)
        .addSeparatorComponents(new SeparatorBuilder());

    if (banReasons && banReasons.length > 0) {
        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(reasonList);
        container.addActionRowComponents(selectMenuRow);
    } else {
        const actionButton = server.is_banned ? unbanButton : banButton;
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(actionButton, viewOffenderButton);
        container.addActionRowComponents(buttonRow);
    }

    const message: UniversalMessage = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    return message;
}

export { serverView };
