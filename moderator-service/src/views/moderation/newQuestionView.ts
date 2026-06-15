import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import type { Question, User, Server } from "@vulps22/project-encourage-types";
import { UniversalMessage } from "@vulps22/bot-interactions";

async function newQuestionView(question: Question, banReasons: [] | null = null, user?: User | null, server?: Server | null): Promise<UniversalMessage> {


    const title = new TextDisplayBuilder()
        .setContent(`🆕 **New ${question.type.charAt(0).toUpperCase() + question.type.slice(1)}!**`);

    const questionText = new TextDisplayBuilder()
        .setContent(`**Question:** \n ${question.question}`);

    const username = user?.username ?? 'Unknown User';
    const guildName = server?.name ?? 'Unknown Server';

    const authorInfo = new TextDisplayBuilder()
        //.setContent(`**Submitted by:**\n<@${question.user_id}> | ${question.user_id})`);
        .setContent(`**Submitted by:**\n${username} (User ID: ${question.user_id})`);

    const serverInfo = new TextDisplayBuilder()
        .setContent(`**Server Name:**\n${guildName} | ${question.server_id}`);

    const id: TextDisplayBuilder = new TextDisplayBuilder()
        .setContent(`**Question ID:**\n${question.id}`);

    // Approved info (if available) — show mention rather than fetching username
    let approvedInfo: TextDisplayBuilder | null = null;
    if (question.is_approved && question.approved_by) {
        approvedInfo = new TextDisplayBuilder()
            .setContent(`**Approved By:**\n<@${question.approved_by}> (User ID: ${question.approved_by})`);
    }

    // Banned info (if available) — show mention rather than fetching username
    let bannedByInfo: TextDisplayBuilder | null = null;
    let banReasonInfo: TextDisplayBuilder | null = null;
    if (question.is_banned) {
        if (question.ban_reason) {
            banReasonInfo = new TextDisplayBuilder()
                .setContent(`**Ban Reason:**\n${question.ban_reason}`);
        }

        if (question.banned_by) {
            bannedByInfo = new TextDisplayBuilder()
                .setContent(`**Banned By:**\n<@${question.banned_by}> (User ID: ${question.banned_by})`);
        }
    }

    const approveButton = new ButtonBuilder()
        .setCustomId(`moderation_approveQuestion_id:${question.id}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success)
        .setDisabled(question.is_approved);

    const banButton = new ButtonBuilder()
        .setCustomId(`moderation_banQuestion_id:${question.id}`)
        .setLabel('Ban')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(question.is_banned);


    const showUserButton = new ButtonBuilder()
        .setCustomId(`moderation_showUser_id:${question.user_id}`)
        .setLabel('Show User')//TODO: create a view detailing the user's stats, server count, banned/approved numbers, xp etc with ban/unban buttons
        .setStyle(ButtonStyle.Secondary)

    const reasonList = new StringSelectMenuBuilder()
        .addOptions(banReasons || [])
        .setCustomId(`moderation_questionBanReasonSelected_id:${question.id}`)
        .setPlaceholder('Select a reason for banning')
        .setMinValues(1)
        .setMaxValues(1);

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(questionText, authorInfo, serverInfo, id)

    if (approvedInfo || banReasonInfo || bannedByInfo) {
        container.addSeparatorComponents(new SeparatorBuilder());
    }


    // Insert approval / ban info when present
    if (approvedInfo) container.addTextDisplayComponents(approvedInfo);
    if (banReasonInfo) container.addTextDisplayComponents(banReasonInfo);
    if (bannedByInfo) container.addTextDisplayComponents(bannedByInfo);

    container.addSeparatorComponents(new SeparatorBuilder());

    if (!banReasons || banReasons.length === 0) {
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(approveButton, banButton, showUserButton);
        container.addActionRowComponents(buttonRow);
    } else {
        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(reasonList);
        container.addActionRowComponents(selectMenuRow);
    }

    const message: UniversalMessage = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    return message;
}

export { newQuestionView };