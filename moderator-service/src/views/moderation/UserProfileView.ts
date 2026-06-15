import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import { UserProfile } from "@vulps22/project-encourage-types";
import { UniversalMessage } from "@vulps22/bot-interactions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function userProfileView(profile: UserProfile, banReasons: any[] | null = null): Promise<UniversalMessage> {
    const client = global.client;

    // Fetch user to get current username
    const user = await client.users.fetch(profile.id);
    const username = user ? user.username : "Unknown User";

    // Title
    const title = new TextDisplayBuilder()
        .setContent(`👤 **User Profile: ${username}**`);

    // User ID
    const userId = new TextDisplayBuilder()
        .setContent(`**User ID:** ${profile.id}`);

    // Account Status
    const statusEmoji = profile.isBanned ? "🚫" : "✅";
    const statusText = profile.isBanned ? "BANNED" : "Active";
    const accountStatus = new TextDisplayBuilder()
        .setContent(`**Account Status:** ${statusEmoji} ${statusText}`);

    // Ban Reason (only if banned)
    const banReasonDisplay = profile.isBanned && profile.banReason
        ? new TextDisplayBuilder().setContent(`**Ban Reason:** ${profile.banReason}`)
        : null;

    // Rules Accepted
    const rulesEmoji = profile.rulesAccepted ? "✅" : "❌";
    const rulesStatus = new TextDisplayBuilder()
        .setContent(`**Rules Accepted:** ${rulesEmoji}`);

    // Global Level & XP
    const levelXP = new TextDisplayBuilder()
        .setContent(`**Global Level:** ${profile.globalLevel} | **XP:** ${profile.globalXP}`);

    // Questions Statistics
    const questionsStats = new TextDisplayBuilder()
        .setContent(
            `**Questions Submitted:** ${profile.totalQuestions}\n` +
            `✅ Approved: ${profile.approvedQuestions} | 🚫 Banned: ${profile.bannedQuestions}`
        );

    // Server Statistics
    const serverStats = new TextDisplayBuilder()
        .setContent(
            `**Servers:** ${profile.totalServers} total | ${profile.serversOwned} owned | ${profile.serversBanned} banned`
        );

    // Account Dates
    const createdDate = new Date(profile.createdDateTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const accountDates = new TextDisplayBuilder()
        .setContent(`**Account Created:** ${createdDate}`);

    // Delete Date (only if scheduled for deletion)
    const deleteDateDisplay = profile.deleteDate
        ? new TextDisplayBuilder().setContent(
            `**Scheduled for Deletion:** ${new Date(profile.deleteDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`
        )
        : null;

    // Ban/Unban Button or Ban Reasons Select Menu
    const banButton = new ButtonBuilder()
        .setCustomId(`moderation_banUser_id:${profile.id}`)
        .setLabel('Ban User')
        .setStyle(ButtonStyle.Danger);

    const unbanButton = new ButtonBuilder()
        .setCustomId(`moderation_unbanUser_id:${profile.id}`)
        .setLabel('Unban User')
        .setStyle(ButtonStyle.Success);

    const banReasonsMenu = banReasons ? new StringSelectMenuBuilder()
        .addOptions(banReasons)
        .setCustomId(`moderation_userBanReasonSelected_id:${profile.id}`)
        .setPlaceholder('Select a reason for banning')
        .setMinValues(1)
        .setMaxValues(1) : null;

    const sendToModeratorsButton = new ButtonBuilder()
        .setCustomId(`moderation_sendToModerators_id:${profile.id}`)
        .setLabel('Send to Mod Chat')
        .setStyle(ButtonStyle.Secondary);

    const userSection = new SectionBuilder()
        .addTextDisplayComponents(userId, accountStatus);
    if (banReasonDisplay) {
        userSection.addTextDisplayComponents(banReasonDisplay);
    }
    // Sections MUST have an accessory button per discords validation standards. so we cannot make the button conditional
    userSection.setButtonAccessory(profile.isBanned ? unbanButton : banButton);

    // Build Container
    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addSectionComponents(userSection)
        .addTextDisplayComponents(rulesStatus, levelXP)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(questionsStats, serverStats)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(accountDates)


    if (deleteDateDisplay) {
        container.addTextDisplayComponents(deleteDateDisplay);
    }

    // Add ban reasons select menu if provided
    if (banReasonsMenu) {
        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(banReasonsMenu);
        container.addActionRowComponents(selectMenuRow);
    }

    container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(sendToModeratorsButton));

    const message: UniversalMessage = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    return message;
}

export { userProfileView };
