import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import { Question } from "../../interface";
import { UniversalMessage } from "../../types";

async function newQuestionView(question: Question, banReasons: [] | null = null): Promise<UniversalMessage> {


    const title = new TextDisplayBuilder()
        .setContent(`🆕 **New ${question.type.charAt(0).toUpperCase() + question.type.slice(1)}!**`);

    const questionText = new TextDisplayBuilder()
        .setContent(`**Question:** \n ${question.question}`);

    const client = global.client;

    //get the user's username. do not use cache
    const user = await client.users.fetch(question.user_id);
    const username = user ? user.username : "Unknown User";

    //get the server's name. do not use cache
    const guild = await client.guilds.fetch(question.server_id);

    const authorInfo = new TextDisplayBuilder()
        //.setContent(`**Submitted by:**\n<@${question.user_id}> | ${question.user_id})`);
        .setContent(`**Submitted by:**\n${username} (User ID: ${question.user_id})`);

    const serverInfo = new TextDisplayBuilder()
        .setContent(`**Server Name:**\n${guild.name} | ${question.server_id}`);

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
        .setCustomId(`moderation_banReasonSelected_id:${question.id}`)
        .setPlaceholder('Select a reason for banning')
        .setMinValues(1)
        .setMaxValues(1);

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(questionText, authorInfo, serverInfo, id);

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